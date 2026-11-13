import type { RxCheckDrugSearchResult, ScrapedInteractionReport } from '../types/rxcheck';
import { searchDrugsFromRxCheck } from './rxCheckApi';

const SCRAPER_BASE_URL = '/api/scraper';
const FALLBACK_DIRECT_URL = 'http://127.0.0.1:5001/api/scraper';

async function safeFetch(path: string, options?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(`${SCRAPER_BASE_URL}${path}`, options);
    if (res.ok) return res;
  } catch {
    // Fall back to direct port if vite proxy is not active
  }

  return fetch(`${FALLBACK_DIRECT_URL}${path}`, options);
}

/**
 * Checks if the local Scrapling scraper backend is running.
 */
export async function checkScraperHealth(): Promise<{ available: boolean; engine?: string }> {
  try {
    const res = await safeFetch('/health', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      return { available: true, engine: data.engine };
    }
  } catch {
    // Backend offline
  }
  return { available: false };
}

/**
 * Searches drugs directly from Drugs.com using the Scrapling scraper backend.
 */
export async function searchDrugsFromDrugsCom(query: string): Promise<RxCheckDrugSearchResult[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  try {
    const res = await safeFetch(`/search?q=${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data: { results: any[]; count: number } = await res.json();
      return data.results.map(item => ({
        name: item.name,
        generic_name: item.generic_name || null,
        rxcui: null,
        brand_names: [],
        drug_class: null,
        source: 'drugs.com' as const,
        code: item.code,
        ddc_id: item.ddc_id,
        brand_name_id: item.brand_name_id,
      }));
    }
  } catch (err) {
    console.warn('Drugs.com scraper search request failed:', err);
  }
  return [];
}

/**
 * Combined search supporting RxCheck, Drugs.com Scraper, or Both.
 */
export async function searchDrugsUnified(
  query: string,
  mode: 'all' | 'drugscom' | 'rxcheck' = 'all'
): Promise<RxCheckDrugSearchResult[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  if (mode === 'rxcheck') {
    const rxResults = await searchDrugsFromRxCheck(clean);
    return rxResults.map(r => ({ ...r, source: 'rxcheck' as const }));
  }

  if (mode === 'drugscom') {
    return searchDrugsFromDrugsCom(clean);
  }

  // mode === 'all': Run both concurrently
  const [rxcheckResults, scraperResults] = await Promise.allSettled([
    searchDrugsFromRxCheck(clean),
    searchDrugsFromDrugsCom(clean),
  ]);

  const map = new Map<string, RxCheckDrugSearchResult>();

  // Add scraper results first
  if (scraperResults.status === 'fulfilled') {
    for (const item of scraperResults.value) {
      const key = item.name.toLowerCase().trim();
      map.set(key, item);
    }
  }

  // Add/merge RxCheck results
  if (rxcheckResults.status === 'fulfilled') {
    for (const item of rxcheckResults.value) {
      const key = item.name.toLowerCase().trim();
      if (map.has(key)) {
        // Tag as both
        const existing = map.get(key)!;
        existing.source = 'both';
        if (!existing.generic_name && item.generic_name) {
          existing.generic_name = item.generic_name;
        }
      } else {
        map.set(key, { ...item, source: 'rxcheck' as const });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Fetches the full scraped Drugs.com interaction report.
 */
export async function fetchDrugsComInteractions(drugs: string[]): Promise<ScrapedInteractionReport | null> {
  if (drugs.length < 2) return null;

  try {
    const res = await safeFetch('/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drugs }),
      signal: AbortSignal.timeout(20000),
    });

    if (res.ok) {
      return (await res.json()) as ScrapedInteractionReport;
    }
  } catch (err) {
    console.warn('Failed to fetch Drugs.com scraped interactions:', err);
  }
  return null;
}
