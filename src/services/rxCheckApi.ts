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
const SEARCH_CACHE_PREFIX = 'rxcheck_query_cache_';

// Common clinical aliases for quick brand-to-generic resolution
const CLINICAL_ALIASES: Record<string, string> = {
  alcohol: 'ethanol',
  tylenol: 'acetaminophen',
  paracetamol: 'acetaminophen',
  advil: 'ibuprofen',
  motrin: 'ibuprofen',
  aleve: 'naproxen',
  coumadin: 'warfarin',
  jantoven: 'warfarin',
  xanax: 'alprazolam',
  ativan: 'lorazepam',
  valium: 'diazepam',
  klonopin: 'clonazepam',
  zoloft: 'sertraline',
  prozac: 'fluoxetine',
  lexapro: 'escitalopram',
  celexa: 'citalopram',
  effexor: 'venlafaxine',
  cymbalta: 'duloxetine',
  wellbutrin: 'bupropion',
  plavix: 'clopidogrel',
  eliquis: 'apixaban',
  xarelto: 'rivaroxaban',
  lipitor: 'atorvastatin',
  crestor: 'rosuvastatin',
  norvasc: 'amlodipine',
  ambien: 'zolpidem',
  weed: 'cannabis',
  marijuana: 'cannabis',
};

export const sanitizeDrugInput = (input: string): string => {
  return input
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
};

/**
 * Live Drug Search directly from RxCheck dataset (/v1/drugs/search?q=...)
 * Queries live RxCheck endpoint and caches queries.
 */
export async function searchDrugsFromRxCheck(query: string): Promise<RxCheckDrugSearchResult[]> {
  const clean = query.trim().toLowerCase();
  if (clean.length < 2) return [];

  // Check query cache
  const cacheKey = SEARCH_CACHE_PREFIX + clean;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as RxCheckDrugSearchResult[];
    }
  } catch {
    // Continue
  }

  // Check alias (e.g. alcohol -> ethanol, tylenol -> acetaminophen)
  const aliasTarget = CLINICAL_ALIASES[clean];
  const queryTerms = [clean];
  if (aliasTarget && !queryTerms.includes(aliasTarget)) {
    queryTerms.push(aliasTarget);
  }

  const resultsMap = new Map<string, RxCheckDrugSearchResult>();

  for (const term of queryTerms) {
    try {
      const res = await fetch(`${BASE_URL}/drugs/search?q=${encodeURIComponent(term)}`, {
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data: { results: RxCheckDrugSearchResult[]; count: number } = await res.json();
        if (data.results && Array.isArray(data.results)) {
          data.results.forEach(d => {
            if (d.name) resultsMap.set(d.name.toLowerCase(), d);
          });
        }
      }
    } catch (err) {
      console.warn(`RxCheck drug search failed for term "${term}":`, err);
    }
  }

  const finalResults = Array.from(resultsMap.values());

  // Cache results
  try {
    localStorage.setItem(cacheKey, JSON.stringify(finalResults));
  } catch {
    // Ignore
  }

  return finalResults;
}

let cachedUsageInfo: RxCheckUsageInfo | null = null;

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

    cachedUsageInfo = data;
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

      // 400 / 422: Unresolved drug or validation issue
      if (response.status === 400 || response.status === 422) {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error?.message || `Could not resolve one of the input substances in the clinical dataset.`;

        return {
          id: pairId,
          drug1: rawDrug1,
          drug2: rawDrug2,
          status: 'no_record_found',
          severity: 'none',
          severityScore: 0,
          isHighPriority: false,
          resolvedDrug1: rawDrug1,
          resolvedDrug2: rawDrug2,
          mechanism: '',
          clinicalSignificance: errMsg,
          management: 'Substance could not be resolved in dataset. Check the spelling or search by generic name, and consult your doctor.',
          evidenceLevel: 'N/A',
          sources: ['RxCheck Active Dataset'],
          disclaimer: 'Absence of record or unverified spelling does NOT establish safety.',
          fromCache: false,
          timestamp: Date.now(),
        };
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
 */
export async function checkPolypharmacyInteractions(
  drugs: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<RxCheckPolypharmacyResponse> {
  const cleanDrugs = Array.from(new Set(drugs.map(d => sanitizeDrugInput(d)))).filter(Boolean);
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

  // Try official Polypharmacy endpoint ONLY if tier features allow it (Growth tier or above)
  if (cachedUsageInfo?.features?.polypharmacy) {
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
      // Continue to coordinated N-choose-2
    }
  }

  // Coordinated N-choose-2 pairs
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
 * Dynamically extract clinical symptoms directly from the text returned by RxCheck records.
 */
export function extractSymptomsFromRecords(results: EvaluatedDrugPair[]): ExtractedClinicalSymptom[] {
  const extracted: ExtractedClinicalSymptom[] = [];
  const seenNames = new Set<string>();

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
