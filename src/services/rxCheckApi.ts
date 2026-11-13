import type { RxCheckApiResponse, EvaluatedDrugPair } from '../types/rxcheck';
import { apiKeysManager } from './apiKeysManager';
import { getCachedInteraction, setCachedInteraction } from './cacheService';

const BASE_URL = import.meta.env.VITE_RXCHECK_BASE_URL || 'https://api.rxcheck.dev/v1';

/**
 * Clean and extract drug search query from strings like "Warfarin (Coumadin)"
 */
export const sanitizeDrugInput = (input: string): string => {
  return input
    .replace(/\(.*?\)/g, '') // remove parenthesized brand names
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
};

/**
 * Fetch interaction between two drugs from RxCheck API, with cache lookup and key rotation
 */
export async function fetchDrugInteraction(
  rawDrug1: string,
  rawDrug2: string,
  forceFresh = false
): Promise<EvaluatedDrugPair> {
  const cleanDrug1 = sanitizeDrugInput(rawDrug1);
  const cleanDrug2 = sanitizeDrugInput(rawDrug2);
  const pairId = `${cleanDrug1.toLowerCase()}::${cleanDrug2.toLowerCase()}`;

  // 1. Check local cache unless forced fresh
  if (!forceFresh) {
    const cached = getCachedInteraction(cleanDrug1, cleanDrug2);
    if (cached) {
      return cached;
    }
  }

  // 2. Prepare API call with fallback key rotation
  let attempts = 0;
  const maxKeyAttempts = Math.max(apiKeysManager.getAllKeys().length, 1);

  while (attempts < maxKeyAttempts) {
    attempts++;
    const apiKey = apiKeysManager.getActiveKey();

    const url = new URL(`${BASE_URL}/interactions`);
    url.searchParams.set('drug1', cleanDrug1);
    url.searchParams.set('drug2', cleanDrug2);

    try {
      const response = await fetchWithBackoff(url.toString(), {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
        },
      });

      // Handle 429 Rate Limit / Out of Quota
      if (response.status === 429) {
        console.warn(`RxCheck API key exhausted (429). Attempting rotation to fallback key...`);
        const rotated = apiKeysManager.rotateToNextKey();
        if (rotated) {
          continue; // retry loop with new key
        } else {
          throw new Error('All configured RxCheck API keys have exhausted their monthly quota (429).');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(`RxCheck API error: ${errMsg}`);
      }

      const data: RxCheckApiResponse = await response.json();

      // Update API Key quota tracking
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
        management: interaction?.management || (isFound ? 'Consult with your prescribing physician or pharmacist.' : 'No interaction record found in dataset. This does NOT establish safety. Check with your doctor.'),
        evidenceLevel: interaction?.evidence_level || (isFound ? 'Clinical Record' : 'N/A'),
        sources: interaction?.sources || ['RxCheck Clinical Dataset'],
        disclaimer: data.disclaimer || 'RxCheck provides clinical dataset records and does not replace medical professional judgment.',
        fromCache: false,
        timestamp: Date.now(),
      };

      // Save to cache
      setCachedInteraction(evaluated);
      return evaluated;
    } catch (err: unknown) {
      if (attempts >= maxKeyAttempts) {
        const message = err instanceof Error ? err.message : String(err);
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
          clinicalSignificance: message,
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

  throw new Error('Failed to evaluate interaction after key rotations.');
}

/**
 * Fetch with exponential backoff on 503 Service Unavailable
 */
async function fetchWithBackoff(url: string, init: RequestInit, retries = 2, delayMs = 600): Promise<Response> {
  try {
    const res = await fetch(url, init);
    if (res.status === 503 && retries > 0) {
      console.warn(`503 Service Unavailable received, backing off for ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
      return fetchWithBackoff(url, init, retries - 1, delayMs * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, delayMs));
      return fetchWithBackoff(url, init, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

/**
 * Evaluate all pairs for N drugs (N >= 2)
 */
export async function evaluateAllDrugPairs(
  drugs: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<EvaluatedDrugPair[]> {
  const cleanDrugs = Array.from(new Set(drugs.map(d => d.trim()))).filter(Boolean);
  if (cleanDrugs.length < 2) return [];

  // Generate all unique combinations: N*(N-1)/2
  const pairs: [string, string][] = [];
  for (let i = 0; i < cleanDrugs.length; i++) {
    for (let j = i + 1; j < cleanDrugs.length; j++) {
      pairs.push([cleanDrugs[i], cleanDrugs[j]]);
    }
  }

  const results: EvaluatedDrugPair[] = [];
  let completed = 0;

  for (const [drugA, drugB] of pairs) {
    try {
      const res = await fetchDrugInteraction(drugA, drugB);
      results.push(res);
    } catch {
      results.push({
        id: `${drugA}::${drugB}`,
        drug1: drugA,
        drug2: drugB,
        status: 'error',
        severity: 'none',
        severityScore: 0,
        isHighPriority: false,
        resolvedDrug1: drugA,
        resolvedDrug2: drugB,
        mechanism: '',
        clinicalSignificance: 'Unable to evaluate interaction record.',
        management: 'Consult your doctor or pharmacist.',
        evidenceLevel: 'N/A',
        sources: [],
        disclaimer: 'Clinical evaluation required.',
        timestamp: Date.now(),
      });
    }

    completed++;
    if (onProgress) {
      onProgress(completed, pairs.length);
    }
  }

  // Sort results by severity: Major first, then Moderate, Minor, No record
  const severityRank: Record<string, number> = {
    major: 4,
    moderate: 3,
    minor: 2,
    none: 1,
  };

  return results.sort((a, b) => {
    const rankA = (severityRank[a.severity] || 0) + (a.isHighPriority ? 2 : 0);
    const rankB = (severityRank[b.severity] || 0) + (b.isHighPriority ? 2 : 0);
    return rankB - rankA;
  });
}
