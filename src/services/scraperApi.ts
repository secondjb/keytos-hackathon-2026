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
 * Checks if the local scraper backend is running.
 */
export async function checkScraperHealth(): Promise<{ available: boolean }> {
  try {
    const res = await safeFetch('/health', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      return { available: true };
    }
  } catch {
    // Backend offline
  }
  return { available: false };
}

/**
 * Searches drugs directly from Drugs.com.
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
      return (data.results || []).map(item => ({
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
    console.warn('Drugs.com search request failed:', err);
  }
  return [];
}

/**
 * Primary search: Queries Drugs.com first.
 * If Drugs.com has results, returns them.
 * If Drugs.com has no results or is unavailable, seamlessly falls back to RxCheck.
 */
export async function searchDrugsUnified(query: string): Promise<RxCheckDrugSearchResult[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  try {
    const drugsComResults = await searchDrugsFromDrugsCom(clean);
    if (drugsComResults && drugsComResults.length > 0) {
      return drugsComResults;
    }
  } catch (err) {
    console.warn('Drugs.com search unavailable, falling back to RxCheck:', err);
  }

  // Fallback to RxCheck
  try {
    const rxResults = await searchDrugsFromRxCheck(clean);
    return (rxResults || []).map(r => ({ ...r, source: 'rxcheck' as const }));
  } catch (err) {
    console.warn('RxCheck search fallback failed:', err);
    return [];
  }
}

/**
 * Fetches the comprehensive Drugs.com interaction report.
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
    console.warn('Failed to fetch Drugs.com interactions:', err);
  }
  return null;
}
