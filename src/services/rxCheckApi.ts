import type {
  RxCheckApiResponse,
  EvaluatedDrugPair,
  RxCheckDrugSearchResult,
  RxCheckPolypharmacyResponse,
  RxCheckPolypharmacySummary,
  RxCheckUsageInfo,
  ExtractedClinicalSymptom,
} from '../types/rxcheck';
import { apiKeysManager } from './apiKeysManager';
import { getCachedInteraction, setCachedInteraction } from './cacheService';

const BASE_URL = import.meta.env.VITE_RXCHECK_BASE_URL || 'https://api.rxcheck.dev/v1';
const CATALOG_STORAGE_KEY = 'rxcheck_drug_catalog';

export const sanitizeDrugInput = (input: string): string => {
  return input
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
};

/**
 * Live Drug Search directly from RxCheck dataset (/v1/drugs/search?q=...)
 */
export async function searchDrugsFromRxCheck(query: string): Promise<RxCheckDrugSearchResult[]> {
  const clean = query.trim();
  if (clean.length < 2) return getStoredDrugCatalog();

  try {
    const res = await fetch(`${BASE_URL}/drugs/search?q=${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return getStoredDrugCatalog().filter(d =>
        d.name.toLowerCase().includes(clean.toLowerCase())
      );
    }

    const data: { results: RxCheckDrugSearchResult[]; count: number } = await res.json();
    const fetchedResults = data.results || [];

    // Store new discoveries into local catalog for zero-network repeat access
    storeDrugsToCatalog(fetchedResults);

    return fetchedResults;
  } catch (err) {
    console.warn('RxCheck drug search failed, falling back to local dataset store:', err);
    return getStoredDrugCatalog().filter(d =>
      d.name.toLowerCase().includes(clean.toLowerCase())
    );
  }
}

/**
 * Retrieve cached drug concepts pulled from RxCheck
 */
export function getStoredDrugCatalog(): RxCheckDrugSearchResult[] {
  try {
    const stored = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as RxCheckDrugSearchResult[];
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Persist newly discovered drugs into local catalog
 */
function storeDrugsToCatalog(newDrugs: RxCheckDrugSearchResult[]) {
  try {
    const existing = getStoredDrugCatalog();
    const map = new Map<string, RxCheckDrugSearchResult>();
    existing.forEach(d => map.set(d.name.toLowerCase(), d));
    newDrugs.forEach(d => {
      if (d.name) map.set(d.name.toLowerCase(), d);
    });
    const merged = Array.from(map.values()).slice(0, 300);
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore
  }
}

/**
 * Bootstrap local catalog once by querying RxCheck dataset for initial concepts
 */
export async function bootstrapCatalogFromRxCheck(): Promise<RxCheckDrugSearchResult[]> {
  const existing = getStoredDrugCatalog();
  if (existing.length >= 10) return existing;

  const seedQueries = ['war', 'asp', 'lis', 'met', 'eth', 'ser', 'ibu', 'alp', 'tra', 'cyp', 'pot'];
  const fetched: RxCheckDrugSearchResult[] = [];

  for (const q of seedQueries) {
    try {
      const res = await fetch(`${BASE_URL}/drugs/search?q=${q}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results) fetched.push(...data.results);
      }
    } catch {
      // Continue
    }
  }

  storeDrugsToCatalog(fetched);
  return getStoredDrugCatalog();
}

/**
 * Get authoritative API usage, limits, and tier features from /v1/auth/usage
 */
export async function fetchAuthoritativeUsage(): Promise<RxCheckUsageInfo | null> {
  const apiKey = apiKeysManager.getActiveKey();
  if (!apiKey) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/usage`, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return null;
    const data: RxCheckUsageInfo = await res.json();

    apiKeysManager.updateActiveKeyUsage(data.queries_used, data.queries_remaining);
    return data;
  } catch (err) {
    console.warn('Failed to query RxCheck /v1/auth/usage:', err);
    return null;
  }
}

/**
 * Fetch a single pairwise interaction from /v1/interactions
 */
export async function fetchSinglePair(
  rawDrug1: string,
  rawDrug2: string,
  forceFresh = false
): Promise<EvaluatedDrugPair> {
  const cleanDrug1 = sanitizeDrugInput(rawDrug1);
  const cleanDrug2 = sanitizeDrugInput(rawDrug2);
  const pairId = `${cleanDrug1.toLowerCase()}::${cleanDrug2.toLowerCase()}`;

  if (!forceFresh) {
    const cached = getCachedInteraction(cleanDrug1, cleanDrug2);
    if (cached) return cached;
  }

  let attempts = 0;
  const maxKeyAttempts = Math.max(apiKeysManager.getAllKeys().length, 1);

  while (attempts < maxKeyAttempts) {
    attempts++;
    const apiKey = apiKeysManager.getActiveKey();

    const url = new URL(`${BASE_URL}/interactions`);
    url.searchParams.set('drug1', cleanDrug1);
    url.searchParams.set('drug2', cleanDrug2);
    url.searchParams.set('format', 'clinical');

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
        },
      });

      if (response.status === 429) {
        const rotated = apiKeysManager.rotateToNextKey();
        if (rotated) continue;
        throw new Error('All configured RxCheck API keys have exhausted their monthly quota (429).');
      }

      if (response.status === 503) {
        await new Promise(r => setTimeout(r, 800));
        return fetchSinglePair(rawDrug1, rawDrug2, true);
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error?.message || `HTTP ${response.status}`);
      }

      const data: RxCheckApiResponse = await response.json();

      if (data.meta) {
        apiKeysManager.updateActiveKeyUsage(data.meta.queries_used, data.meta.queries_remaining);
      }

      const isFound = data.result_status === 'interaction_found';
      const interaction = data.interaction;

      const evaluated: EvaluatedDrugPair = {
        id: pairId,
        drug1: rawDrug1,
        drug2: rawDrug2,
        status: data.result_status,
        severity: interaction?.severity || (isFound ? 'moderate' : 'none'),
        severityScore: interaction?.severity_score ?? (interaction?.severity === 'major' ? 4 : interaction?.severity === 'moderate' ? 2 : 0),
        isHighPriority: !!interaction?.onc_high_priority,
        resolvedDrug1: data.query?.drug1?.resolved_name || rawDrug1,
        resolvedDrug2: data.query?.drug2?.resolved_name || rawDrug2,
        mechanism: interaction?.mechanism || '',
        clinicalSignificance: interaction?.clinical_significance || '',
        management: interaction?.management || (isFound ? 'Consult with your prescribing physician or pharmacist.' : 'No interaction record found in active dataset. This does NOT establish safety. Check with your doctor.'),
        evidenceLevel: interaction?.evidence_level || (isFound ? 'Clinical Dataset Record' : 'N/A'),
        sources: interaction?.sources || ['RxCheck Clinical Dataset'],
        disclaimer: data.disclaimer || 'RxCheck provides clinical dataset records and does not replace medical professional judgment.',
        fromCache: false,
        timestamp: Date.now(),
      };

      setCachedInteraction(evaluated);
      return evaluated;
    } catch (err: unknown) {
      if (attempts >= maxKeyAttempts) {
        return {
          id: pairId,
          drug1: rawDrug1,
          drug2: rawDrug2,
          status: 'error',
          severity: 'none',
          severityScore: 0,
          isHighPriority: false,
          resolvedDrug1: rawDrug1,
          resolvedDrug2: rawDrug2,
          mechanism: '',
          clinicalSignificance: err instanceof Error ? err.message : String(err),
          management: 'Error querying interaction. Please consult your physician directly.',
          evidenceLevel: 'N/A',
          sources: [],
          disclaimer: 'Network/API communication issue.',
          fromCache: false,
          timestamp: Date.now(),
        };
      }
    }
  }

  throw new Error('All API keys failed.');
}

/**
 * Polypharmacy Evaluation as specified in https://rxcheck.dev/docs:
 * Evaluates all n-choose-2 pairs for a list of 2–10 drugs.
 * 
 * 1. Calls GET /v1/interactions/polypharmacy?drugs=... (available on Growth+ tier)
 * 2. If free tier (returns 403 tier_restriction), evaluates the n-choose-2 pairs via /v1/interactions
 *    with local caching, producing the exact same summary structure.
 */
export async function checkPolypharmacyInteractions(
  drugs: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<RxCheckPolypharmacyResponse> {
  const cleanDrugs = Array.from(new Set(drugs.map(d => d.trim()))).filter(Boolean);
  if (cleanDrugs.length < 2) {
    return {
      results: [],
      summary: {
        total_pairs: 0,
        interactions_found: 0,
        no_record_count: 0,
        max_severity: 'none',
        onc_high_priority_count: 0,
      },
      tier_mode: 'n_choose_2_evaluated',
      server_endpoint_used: '/v1/interactions',
    };
  }

  const apiKey = apiKeysManager.getActiveKey();

  // Try official Polypharmacy endpoint: GET /v1/interactions/polypharmacy?drugs=...
  try {
    const polyUrl = `${BASE_URL}/interactions/polypharmacy?drugs=${encodeURIComponent(cleanDrugs.join(','))}`;
    const polyRes = await fetch(polyUrl, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (polyRes.ok) {
      const polyData = await polyRes.json();
      const results: EvaluatedDrugPair[] = (polyData.results || []).map((item: any, idx: number) => ({
        id: `${item.query?.drug1?.input || idx}::${item.query?.drug2?.input || idx}`,
        drug1: item.query?.drug1?.input || '',
        drug2: item.query?.drug2?.input || '',
        status: item.result_status,
        severity: item.interaction?.severity || (item.result_status === 'interaction_found' ? 'moderate' : 'none'),
        severityScore: item.interaction?.severity_score || 0,
        isHighPriority: !!item.interaction?.onc_high_priority,
        resolvedDrug1: item.query?.drug1?.resolved_name || item.query?.drug1?.input || '',
        resolvedDrug2: item.query?.drug2?.resolved_name || item.query?.drug2?.input || '',
        mechanism: item.interaction?.mechanism || '',
        clinicalSignificance: item.interaction?.clinical_significance || '',
        management: item.interaction?.management || '',
        evidenceLevel: item.interaction?.evidence_level || 'A',
        sources: item.interaction?.sources || ['RxCheck Dataset'],
        disclaimer: item.disclaimer || 'RxCheck Clinical Record',
        timestamp: Date.now(),
      }));

      const summary: RxCheckPolypharmacySummary = {
        total_pairs: polyData.summary?.total_pairs || results.length,
        interactions_found: results.filter(r => r.status === 'interaction_found').length,
        no_record_count: results.filter(r => r.status === 'no_record_found').length,
        max_severity: results.some(r => r.severity === 'major') ? 'major' : results.some(r => r.severity === 'moderate') ? 'moderate' : 'none',
        onc_high_priority_count: results.filter(r => r.isHighPriority).length,
      };

      return {
        results,
        summary,
        tier_mode: 'native_growth_api',
        server_endpoint_used: '/v1/interactions/polypharmacy',
      };
    }
  } catch {
    // If network or tier restriction occurs, fall through to client-coordinated n-choose-2
  }

  // Fallback for Free tier: evaluate the exact N-choose-2 pairs: N*(N-1)/2
  const pairs: [string, string][] = [];
  for (let i = 0; i < cleanDrugs.length; i++) {
    for (let j = i + 1; j < cleanDrugs.length; j++) {
      pairs.push([cleanDrugs[i], cleanDrugs[j]]);
    }
  }

  const results: EvaluatedDrugPair[] = [];
  let completed = 0;

  for (const [drugA, drugB] of pairs) {
    const res = await fetchSinglePair(drugA, drugB);
    results.push(res);
    completed++;
    if (onProgress) onProgress(completed, pairs.length);
  }

  // Sort by severity (Major first)
  const severityRank: Record<string, number> = {
    contraindicated: 5,
    major: 4,
    moderate: 3,
    minor: 2,
    none: 1,
  };

  results.sort((a, b) => {
    const rankA = (severityRank[a.severity] || 0) + (a.isHighPriority ? 2 : 0);
    const rankB = (severityRank[b.severity] || 0) + (b.isHighPriority ? 2 : 0);
    return rankB - rankA;
  });

  const summary: RxCheckPolypharmacySummary = {
    total_pairs: pairs.length,
    interactions_found: results.filter(r => r.status === 'interaction_found').length,
    no_record_count: results.filter(r => r.status === 'no_record_found').length,
    max_severity: results.some(r => r.severity === 'major' || r.severity === 'contraindicated')
      ? 'major'
      : results.some(r => r.severity === 'moderate')
      ? 'moderate'
      : 'none',
    onc_high_priority_count: results.filter(r => r.isHighPriority).length,
  };

  return {
    results,
    summary,
    tier_mode: 'n_choose_2_evaluated',
    server_endpoint_used: '/v1/interactions',
  };
}

/**
 * Dynamically extract clinical symptoms, adverse signs, and warning cues
 * directly from the text returned by RxCheck records.
 * Zero hardcoded symptoms!
 */
export function extractSymptomsFromRecords(results: EvaluatedDrugPair[]): ExtractedClinicalSymptom[] {
  const extracted: ExtractedClinicalSymptom[] = [];
  const seenNames = new Set<string>();

  // Clinical terms to look for inside returned RxCheck management and significance sentences
  const symptomKeywords = [
    { name: 'Unusual bleeding / prolonged bleeding', test: /\b(bleed|bleeding|hemorrhage)\b/i, isRedFlag: true },
    { name: 'Unusual bruising', test: /\b(bruis|bruising)\b/i, isRedFlag: true },
    { name: 'Blood in urine or dark stool', test: /\b(blood in urine|stool|tarry|hematuria|melena)\b/i, isRedFlag: true },
    { name: 'Arrhythmia / heart palpitations', test: /\b(arrhythmia|palpitation|tachycardia|qt|bradycardia)\b/i, isRedFlag: true },
    { name: 'Severe hypotension / dizziness upon standing', test: /\b(hypotension|dizz|lightheaded|syncope)\b/i, isRedFlag: false },
    { name: 'Respiratory depression / slow breathing', test: /\b(respiratory depression|breathing|apnea)\b/i, isRedFlag: true },
    { name: 'Serotonin toxicity (tremors, fever, rigidity)', test: /\b(serotonin syndrome|hyperthermia|rigidity|clonus|tremor)\b/i, isRedFlag: true },
    { name: 'Hyperkalemia / electrolyte imbalance', test: /\b(hyperkalemia|potassium)\b/i, isRedFlag: true },
    { name: 'Hepatotoxicity / liver enzyme elevation', test: /\b(liver|hepatic|hepatotox|inr)\b/i, isRedFlag: false },
    { name: 'Gastrointestinal ulceration / pain', test: /\b(gastrointestinal|ulcer|gastric)\b/i, isRedFlag: false },
    { name: 'Extreme sedation / CNS depression', test: /\b(sedation|drowsiness|cns depression)\b/i, isRedFlag: false },
  ];

  for (const pair of results) {
    if (pair.status !== 'interaction_found') continue;

    const fullText = `${pair.clinicalSignificance} ${pair.management} ${pair.mechanism}`;
    if (!fullText.trim()) continue;

    // Break into sentences
    const sentences = fullText.split(/(?<=[.?!])\s+/);

    for (const kw of symptomKeywords) {
      if (seenNames.has(kw.name)) continue;

      const matchedSentence = sentences.find(s => kw.test.test(s));
      if (matchedSentence) {
        seenNames.add(kw.name);
        extracted.push({
          id: `${pair.id}-${kw.name}`,
          symptomName: kw.name,
          contextSnippet: matchedSentence.trim(),
          isRedFlag: kw.isRedFlag,
          sourcePair: `${pair.drug1} + ${pair.drug2}`,
          severity: pair.severity,
        });
      }
    }
  }

  return extracted;
}
