import type {
  RxCheckDrugSearchResult,
  ScrapedInteractionReport,
  EvaluatedDrugPair,
  ExtractedClinicalSymptom,
  SeverityLevel,
} from '../types/rxcheck';

const SCRAPER_BASE_URL = '/api/scraper';
const FALLBACK_DIRECT_URL = 'http://127.0.0.1:5001/api/scraper';

async function safeFetch(path: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${SCRAPER_BASE_URL}${path}`, {
      ...options,
      signal: options?.signal || controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) return res;
  } catch (err) {
    clearTimeout(timeoutId);
    // Try fallback port in case vite proxy isn't routing
    try {
      const fallbackRes = await fetch(`${FALLBACK_DIRECT_URL}${path}`, {
        ...options,
        signal: AbortSignal.timeout(6000),
      });
      if (fallbackRes.ok) return fallbackRes;
    } catch {
      throw err;
    }
  }

  throw new Error(`Failed to fetch ${path}`);
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
 * Deduplicates drug search results by normalized name.
 * Prioritizes earlier items (e.g. Drugs.com official entries over fallbacks).
 */
export function deduplicateSearchResults(results: RxCheckDrugSearchResult[]): RxCheckDrugSearchResult[] {
  const seen = new Set<string>();
  const unique: RxCheckDrugSearchResult[] = [];

  for (const item of results) {
    if (!item || !item.name) continue;
    const norm = item.name.trim().toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    unique.push(item);
  }

  return unique;
}

// Instant local clinical index for immediate (<10ms) keystroke matches
const INSTANT_MEDICATIONS: Array<{ name: string; generic_name?: string }> = [
  { name: 'Alprazolam' },
  { name: 'Alprazolam Intensol', generic_name: 'alprazolam' },
  { name: 'Xanax', generic_name: 'alprazolam' },
  { name: 'Aspirin', generic_name: 'acetylsalicylic acid' },
  { name: 'Warfarin' },
  { name: 'Coumadin', generic_name: 'warfarin' },
  { name: 'Metformin' },
  { name: 'Lisinopril' },
  { name: 'Atorvastatin' },
  { name: 'Lipitor', generic_name: 'atorvastatin' },
  { name: 'Amlodipine' },
  { name: 'Norvasc', generic_name: 'amlodipine' },
  { name: 'Omeprazole' },
  { name: 'Prilosec', generic_name: 'omeprazole' },
  { name: 'Levothyroxine' },
  { name: 'Synthroid', generic_name: 'levothyroxine' },
  { name: 'Metoprolol' },
  { name: 'Losartan' },
  { name: 'Gabapentin' },
  { name: 'Hydrochlorothiazide' },
  { name: 'Sertraline' },
  { name: 'Zoloft', generic_name: 'sertraline' },
  { name: 'Simvastatin' },
  { name: 'Montelukast' },
  { name: 'Singulair', generic_name: 'montelukast' },
  { name: 'Escitalopram' },
  { name: 'Lexapro', generic_name: 'escitalopram' },
  { name: 'Acetaminophen' },
  { name: 'Tylenol', generic_name: 'acetaminophen' },
  { name: 'Ibuprofen' },
  { name: 'Advil', generic_name: 'ibuprofen' },
  { name: 'Motrin', generic_name: 'ibuprofen' },
  { name: 'Naproxen' },
  { name: 'Aleve', generic_name: 'naproxen' },
  { name: 'Amoxicillin' },
  { name: 'Prednisone' },
  { name: 'Tramadol' },
  { name: 'Clonazepam' },
  { name: 'Klonopin', generic_name: 'clonazepam' },
  { name: 'Lorazepam' },
  { name: 'Ativan', generic_name: 'lorazepam' },
  { name: 'Diazepam' },
  { name: 'Valium', generic_name: 'diazepam' },
  { name: 'Zolpidem' },
  { name: 'Ambien', generic_name: 'zolpidem' },
  { name: 'Duloxetine' },
  { name: 'Cymbalta', generic_name: 'duloxetine' },
  { name: 'Venlafaxine' },
  { name: 'Effexor', generic_name: 'venlafaxine' },
  { name: 'Fluoxetine' },
  { name: 'Prozac', generic_name: 'fluoxetine' },
  { name: 'Citalopram' },
  { name: 'Celexa', generic_name: 'citalopram' },
  { name: 'Bupropion' },
  { name: 'Wellbutrin', generic_name: 'bupropion' },
  { name: 'Apixaban' },
  { name: 'Eliquis', generic_name: 'apixaban' },
  { name: 'Rivaroxaban' },
  { name: 'Xarelto', generic_name: 'rivaroxaban' },
  { name: 'Clopidogrel' },
  { name: 'Plavix', generic_name: 'clopidogrel' },
  { name: 'Furosemide' },
  { name: 'Lasix', generic_name: 'furosemide' },
  { name: 'Pantoprazole' },
  { name: 'Carvedilol' },
  { name: 'Diltiazem' },
  { name: 'Spironolactone' },
  { name: 'Meloxicam' },
];

/**
 * Streaming search:
 * 1. Emits instant results (<10ms) from local index.
 * 2. Asynchronously fetches Drugs.com autocomplete and merges them as they arrive.
 * 3. Seamlessly falls back / complements with RxCheck if Drugs.com is unavailable.
 */
export async function searchDrugsStreaming(
  query: string,
  onResults: (results: RxCheckDrugSearchResult[], isDone: boolean) => void,
  signal?: AbortSignal
): Promise<void> {
  const clean = query.trim().toLowerCase();
  if (clean.length < 2) {
    onResults([], true);
    return;
  }

  // Stage 1: Instant local results (<10ms)
  const instantMatches: RxCheckDrugSearchResult[] = INSTANT_MEDICATIONS
    .filter(m => m.name.toLowerCase().includes(clean) || (m.generic_name && m.generic_name.toLowerCase().includes(clean)))
    .map(m => ({
      name: m.name,
      generic_name: m.generic_name || null,
      rxcui: null,
      brand_names: [],
      drug_class: null,
      source: 'drugs.com' as const,
    }));

  if (instantMatches.length > 0 && !signal?.aborted) {
    onResults(instantMatches, false);
  }

  if (signal?.aborted) return;

  // Stage 2: Concurrently fetch authoritative Drugs.com autocomplete
  try {
    const drugsComResults = await searchDrugsFromDrugsCom(clean);

    if (signal?.aborted) return;

    if (drugsComResults && drugsComResults.length > 0) {
      // Merge with instant matches, prioritizing Drugs.com results
      const combined = deduplicateSearchResults([...drugsComResults, ...instantMatches]);
      onResults(combined, true);
      return;
    }
  } catch (err) {
    console.warn('Drugs.com live search error:', err);
  }

  if (signal?.aborted) return;

  // Final fallback to instant local index matches
  onResults(instantMatches, true);
}

/**
 * Primary search: Queries Drugs.com webscraper first, falling back to local clinical index.
 */
export async function searchDrugsUnified(query: string): Promise<RxCheckDrugSearchResult[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  try {
    const drugsComResults = await searchDrugsFromDrugsCom(clean);
    if (drugsComResults && drugsComResults.length > 0) {
      return deduplicateSearchResults(drugsComResults);
    }
  } catch (err) {
    console.warn('Drugs.com search unavailable:', err);
  }

  // Fallback to local index
  const lower = clean.toLowerCase();
  const instant = INSTANT_MEDICATIONS
    .filter(m => m.name.toLowerCase().includes(lower) || (m.generic_name && m.generic_name.toLowerCase().includes(lower)))
    .map(m => ({
      name: m.name,
      generic_name: m.generic_name || null,
      rxcui: null,
      brand_names: [],
      drug_class: null,
      source: 'drugs.com' as const,
    }));

  return deduplicateSearchResults(instant);
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
    });

    if (res.ok) {
      return (await res.json()) as ScrapedInteractionReport;
    }
  } catch (err) {
    console.warn('Failed to fetch Drugs.com interactions:', err);
  }
  return null;
}

/**
 * Maps Drugs.com clinical interaction report into comprehensive pairwise EvaluatedDrugPair records.
 * Evaluates all pairwise combinations (N choose 2) directly against the Drugs.com report.
 */
export function convertDrugsComReportToPairs(
  drugs: string[],
  report: ScrapedInteractionReport
): EvaluatedDrugPair[] {
  if (drugs.length < 2) return [];

  const pairs: EvaluatedDrugPair[] = [];
  const interactions = report?.drug_interactions || [];

  const extractTokens = (name: string): string[] => {
    const list: string[] = [name.toLowerCase().trim()];
    const parens = name.match(/\((.*?)\)/);
    if (parens && parens[1]) list.push(parens[1].toLowerCase().trim());
    const without = name.replace(/\(.*?\)/g, '').toLowerCase().trim();
    if (without) list.push(without);
    return list;
  };

  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      const drug1 = drugs[i];
      const drug2 = drugs[j];
      const tokens1 = extractTokens(drug1);
      const tokens2 = extractTokens(drug2);

      // Find matching interaction item from Drugs.com
      const matchingItem = interactions.find(item => {
        // 1. Check applies_to if present
        if (item.applies_to && item.applies_to.length >= 2) {
          const appStr = item.applies_to.join(' ').toLowerCase();
          const m1 = tokens1.some(t => appStr.includes(t));
          const m2 = tokens2.some(t => appStr.includes(t));
          if (m1 && m2) return true;
        }

        // 2. Check title (e.g. "ALPRAZolam and oxyCODONE", "warfarin aspirin")
        const titleLow = (item.title || '').toLowerCase();
        const t1 = tokens1.some(t => titleLow.includes(t));
        const t2 = tokens2.some(t => titleLow.includes(t));
        if (t1 && t2) return true;

        // 3. Check full text
        const textLow = (item.text || '').toLowerCase();
        const tx1 = tokens1.some(t => textLow.includes(t));
        const tx2 = tokens2.some(t => textLow.includes(t));
        if (tx1 && tx2) return true;

        return false;
      });

      if (matchingItem) {
        const sevLower = (matchingItem.severity || 'Unknown').toLowerCase();
        let severity: SeverityLevel = 'moderate';
        let severityScore = 6;
        let isHighPriority = false;

        if (sevLower === 'major') {
          severity = 'major';
          severityScore = 9;
          isHighPriority = true;
        } else if (sevLower === 'minor') {
          severity = 'minor';
          severityScore = 3;
          isHighPriority = false;
        }

        pairs.push({
          id: `${drug1.toLowerCase()}::${drug2.toLowerCase()}`,
          drug1,
          drug2,
          status: 'interaction_found',
          severity,
          severityScore,
          isHighPriority,
          resolvedDrug1: drug1,
          resolvedDrug2: drug2,
          mechanism: matchingItem.text,
          clinicalSignificance: matchingItem.title,
          management:
            'Consult your physician or pharmacist. Dose adjustment, clinical monitoring, or alternative therapies may be advised.',
          evidenceLevel: 'Clinical Documentation (Drugs.com)',
          sources: ['Drugs.com Clinical Interaction Database'],
          disclaimer:
            'Data compiled from authoritative clinical monographs. Always verify with your physician.',
          timestamp: Date.now(),
        });
      } else {
        pairs.push({
          id: `${drug1.toLowerCase()}::${drug2.toLowerCase()}`,
          drug1,
          drug2,
          status: 'no_record_found',
          severity: 'none',
          severityScore: 0,
          isHighPriority: false,
          resolvedDrug1: drug1,
          resolvedDrug2: drug2,
          mechanism:
            'No documented clinical interaction between these two medications was identified in current clinical monographs.',
          clinicalSignificance: 'No interaction documented',
          management:
            'No specific interaction precautions identified. Maintain prescribed dosing as directed.',
          evidenceLevel: 'Clinical Documentation (Drugs.com)',
          sources: ['Drugs.com Clinical Interaction Database'],
          disclaimer:
            'Absence of a documented interaction does not eliminate individual risks or adverse reactions. Verify with your physician.',
          timestamp: Date.now(),
        });
      }
    }
  }

  const severityRank: Record<SeverityLevel, number> = {
    contraindicated: 0,
    major: 1,
    moderate: 2,
    minor: 3,
    none: 4,
  };

  return pairs.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

/**
 * Dynamically extracts clinical symptoms directly from interaction records.
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
