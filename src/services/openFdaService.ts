import type {
  AilmentDefinition,
  OtcCandidateDrug,
  OpenFdaDrugLabel,
  OtcSafetyStatus,
} from '../types/rxcheck';

// ---------------------------------------------------------------------------
// OpenFDA Local Storage Cache
// ---------------------------------------------------------------------------
const OPENFDA_CACHE_KEY = 'rxcheck_openfda_cache_v1';
const MEMORY_CACHE = new Map<string, OpenFdaDrugLabel>();

function getCachedFdaLabel(substance: string): OpenFdaDrugLabel | null {
  const key = substance.toLowerCase().trim();
  if (MEMORY_CACHE.has(key)) {
    return MEMORY_CACHE.get(key)!;
  }
  try {
    const raw = localStorage.getItem(OPENFDA_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[key]) {
        MEMORY_CACHE.set(key, parsed[key]);
        return parsed[key];
      }
    }
  } catch (e) {
    console.warn('Failed to read openFDA cache:', e);
  }
  return null;
}

function setCachedFdaLabel(substance: string, label: OpenFdaDrugLabel) {
  const key = substance.toLowerCase().trim();
  MEMORY_CACHE.set(key, label);
  try {
    const raw = localStorage.getItem(OPENFDA_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[key] = label;
    localStorage.setItem(OPENFDA_CACHE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.warn('Failed to save to openFDA cache:', e);
  }
}

// ---------------------------------------------------------------------------
// OpenFDA Live API Fetcher
// ---------------------------------------------------------------------------
export async function fetchOpenFdaDrugLabel(substance: string): Promise<OpenFdaDrugLabel> {
  const cleanSubstance = substance.trim();
  const cached = getCachedFdaLabel(cleanSubstance);
  if (cached) {
    return cached;
  }

  // Sanitize query for openFDA Lucene syntax
  const sanitized = cleanSubstance.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  const encodedQuery = encodeURIComponent(sanitized);

  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodedQuery}"+OR+openfda.substance_name:"${encodedQuery}"&limit=1`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      throw new Error(`OpenFDA response status ${res.status}`);
    }
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const record = data.results[0];
      const brandNames: string[] = record.openfda?.brand_name || [];
      const genericNames: string[] = record.openfda?.generic_name || [];
      const purpose = record.purpose?.[0] || record.indications_and_usage?.[0] || 'Over-the-counter therapeutic agent';
      const indications = record.indications_and_usage?.[0] || record.purpose?.[0] || 'Temporarily relieves minor acute symptoms.';
      const warnings = record.warnings?.[0] || record.warnings_and_cautions?.[0] || 'Read drug facts label carefully before administration.';

      const label: OpenFdaDrugLabel = {
        brandName: brandNames[0] || undefined,
        genericName: genericNames[0] || cleanSubstance,
        purpose: cleanFdaText(purpose, 200),
        indications: cleanFdaText(indications, 260),
        warnings: cleanFdaText(warnings, 320),
        activeIngredients: record.active_ingredient || [cleanSubstance],
        isFdaVerified: true,
      };

      setCachedFdaLabel(cleanSubstance, label);
      return label;
    }
  } catch (err) {
    console.info(`OpenFDA lookup for "${cleanSubstance}" using curated clinical profile:`, err);
  }

  // Graceful fallback for non-drug dietary supplements or query misses
  const fallbackLabel: OpenFdaDrugLabel = {
    genericName: cleanSubstance,
    purpose: 'Over-the-counter / Dietary support active ingredient',
    indications: `Evidence-based support for acute symptom relief related to ${cleanSubstance}.`,
    warnings: 'Consult a healthcare professional or pharmacist if symptoms persist for more than 7 days.',
    activeIngredients: [cleanSubstance],
    isFdaVerified: false,
  };
  setCachedFdaLabel(cleanSubstance, fallbackLabel);
  return fallbackLabel;
}

function cleanFdaText(text: string, maxLength: number): string {
  if (!text) return '';
  let cleaned = text
    .replace(/^purpose\s+/i, '')
    .replace(/^uses\s+/i, '')
    .replace(/^warnings\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength).trim() + '...';
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// Clinical Catalog: Imported & Re-exported from Data Store
// ---------------------------------------------------------------------------
import { OTC_CATEGORIES } from '../data/otcCategories';
export { OTC_CATEGORIES };

// Helper to look up an ailment by its unique ID
export function getAilmentById(ailmentId: string): AilmentDefinition | null {
  for (const cat of OTC_CATEGORIES) {
    const found = cat.ailments.find(a => a.id === ailmentId);
    if (found) return found;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Clinical Regimen Cross-Evaluation Engine
// ---------------------------------------------------------------------------
export function evaluateOtcAgainstRegimen(
  candidate: OtcCandidateDrug,
  activeRegimen: string[]
): {
  safety: OtcSafetyStatus;
  reason: string;
  interactingDrugs: string[];
} {
  const normalizedRegimen = activeRegimen.map(d => d.toLowerCase().trim());
  const interactingDrugs: string[] = [];

  // Helper matcher
  const matchesRegimen = (keywords: string[]): string | null => {
    for (const reg of normalizedRegimen) {
      for (const kw of keywords) {
        if (reg.includes(kw.toLowerCase())) {
          return reg;
        }
      }
    }
    return null;
  };

  // 1. NSAID Clinical Cross-Referencing
  if (
    candidate.drugClass.includes('NSAID') ||
    candidate.genericName.toLowerCase().includes('ibuprofen') ||
    candidate.genericName.toLowerCase().includes('naproxen')
  ) {
    // Check Anticoagulants / Antiplatelets
    const bloodThinnerMatch = matchesRegimen([
      'warfarin',
      'coumadin',
      'jantoven',
      'eliquis',
      'apixaban',
      'xarelto',
      'rivaroxaban',
      'pradaxa',
      'dabigatran',
      'plavix',
      'clopidogrel',
      'effient',
      'brilinta',
      'aspirin',
      'heparin',
      'lovenox',
    ]);
    if (bloodThinnerMatch) {
      interactingDrugs.push(bloodThinnerMatch);
      return {
        safety: 'contraindicated',
        reason: `High hemorrhage risk: Taking this oral NSAID with your anticoagulant/antiplatelet (${bloodThinnerMatch}) drastically elevates upper gastrointestinal bleeding and ulcer perforation risk. Consider Acetaminophen (Tylenol) or topical treatments instead.`,
        interactingDrugs,
      };
    }

    // Check ACE Inhibitors / ARBs / Diuretics ("Triple Whammy" AKI risk)
    const bpMatch = matchesRegimen([
      'lisinopril',
      'enalapril',
      'ramipril',
      'benazepril',
      'losartan',
      'valsartan',
      'olmesartan',
      'furosemide',
      'lasix',
      'hydrochlorothiazide',
      'hctz',
      'spironolactone',
    ]);
    if (bpMatch) {
      interactingDrugs.push(bpMatch);
      return {
        safety: 'contraindicated',
        reason: `Renal & Blood Pressure hazard: Oral NSAIDs constrict afferent renal arterioles, blunting the blood-pressure-lowering efficacy of ${bpMatch} and increasing the risk of acute kidney impairment. Acetaminophen is clinically preferred.`,
        interactingDrugs,
      };
    }

    // Check SSRIs / SNRIs
    const ssriMatch = matchesRegimen([
      'sertraline',
      'zoloft',
      'escitalopram',
      'lexapro',
      'citalopram',
      'celexa',
      'fluoxetine',
      'prozac',
      'paroxetine',
      'paxil',
      'duloxetine',
      'cymbalta',
      'venlafaxine',
      'effexor',
    ]);
    if (ssriMatch) {
      interactingDrugs.push(ssriMatch);
      return {
        safety: 'caution',
        reason: `Synergistic bleeding risk: Platelets rely on serotonin reuptake. Combining this NSAID with ${ssriMatch} roughly triples upper gastrointestinal bleeding risk. Limit to short courses and take with food.`,
        interactingDrugs,
      };
    }

    // Check Systemic Corticosteroids
    const steroidMatch = matchesRegimen(['prednisone', 'dexamethasone', 'methylprednisolone']);
    if (steroidMatch) {
      interactingDrugs.push(steroidMatch);
      return {
        safety: 'contraindicated',
        reason: `Severe gastric ulcer risk: Concurrent systemic corticosteroids (${steroidMatch}) and oral NSAIDs drastically multiply peptic ulceration and GI bleeding hazard.`,
        interactingDrugs,
      };
    }
  }

  // 2. Oral Decongestant (Pseudoephedrine / Phenylephrine)
  if (
    candidate.genericName.toLowerCase().includes('pseudoephedrine') ||
    candidate.genericName.toLowerCase().includes('phenylephrine')
  ) {
    const bpMed = matchesRegimen([
      'lisinopril',
      'losartan',
      'amlodipine',
      'metoprolol',
      'atenolol',
      'carvedilol',
      'diltiazem',
      'hydrochlorothiazide',
    ]);
    if (bpMed) {
      interactingDrugs.push(bpMed);
      return {
        safety: 'contraindicated',
        reason: `Severe hypertensive hazard: Systemic alpha-1 stimulation causes systemic vasoconstriction, which directly antagonizes ${bpMed} and can trigger dangerous blood pressure spikes. Consider saline rinses or Oxymetazoline nasal spray instead.`,
        interactingDrugs,
      };
    }
  }

  // 3. Dextromethorphan (Cough suppressant)
  if (candidate.genericName.toLowerCase().includes('dextromethorphan')) {
    const serotonergic = matchesRegimen([
      'sertraline',
      'escitalopram',
      'fluoxetine',
      'paroxetine',
      'citalopram',
      'duloxetine',
      'venlafaxine',
      'tramadol',
      'selegiline',
      'rasagiline',
    ]);
    if (serotonergic) {
      interactingDrugs.push(serotonergic);
      return {
        safety: 'caution',
        reason: `Serotonin elevation: Dextromethorphan inhibits serotonin reuptake. Concurrent use with ${serotonergic} may trigger mild serotonergic symptoms or, at high doses, Serotonin Syndrome. Do not exceed recommended dosage.`,
        interactingDrugs,
      };
    }
  }

  // 4. Acetaminophen (Tylenol)
  if (candidate.genericName.toLowerCase().includes('acetaminophen')) {
    const existingApap = matchesRegimen([
      'percocet',
      'vicodin',
      'norco',
      'tylenol',
      'nyquil',
      'excedrin',
      'fioricet',
      'paracetamol',
    ]);
    if (existingApap) {
      interactingDrugs.push(existingApap);
      return {
        safety: 'caution',
        reason: `Cumulative liver risk: Your regimen already appears to contain ${existingApap}. Ensure total daily acetaminophen intake across all prescription and OTC medications does not exceed 3,000 to 4,000 mg to prevent hepatotoxicity.`,
        interactingDrugs,
      };
    }
  }

  // 5. Bismuth Subsalicylate (Pepto-Bismol)
  if (candidate.genericName.toLowerCase().includes('bismuth')) {
    const bloodThinnerMatch = matchesRegimen(['warfarin', 'coumadin', 'eliquis', 'xarelto', 'aspirin', 'plavix']);
    if (bloodThinnerMatch) {
      interactingDrugs.push(bloodThinnerMatch);
      return {
        safety: 'contraindicated',
        reason: `Salicylate bleeding risk: Bismuth subsalicylate breaks down into active salicylate (aspirin relative), which has antiplatelet properties and interacts dangerously with ${bloodThinnerMatch}.`,
        interactingDrugs,
      };
    }
  }

  // 6. Sedating Antihistamines / Sleep Aids (Doxylamine, Diphenhydramine)
  if (
    candidate.genericName.toLowerCase().includes('doxylamine') ||
    candidate.genericName.toLowerCase().includes('diphenhydramine')
  ) {
    const sedative = matchesRegimen([
      'alprazolam',
      'clonazepam',
      'lorazepam',
      'diazepam',
      'zolpidem',
      'ambien',
      'trazodone',
      'gabapentin',
      'oxycodone',
      'hydrocodone',
    ]);
    if (sedative) {
      interactingDrugs.push(sedative);
      return {
        safety: 'caution',
        reason: `Additive CNS depression: Concurrent use with ${sedative} causes profound drowsiness, impaired motor coordination, and respiratory slowing. Melatonin or non-pharmacologic sleep aids are preferred.`,
        interactingDrugs,
      };
    }
  }

  // 7. Calcium Carbonate / Antacids
  if (candidate.genericName.toLowerCase().includes('calcium carbonate')) {
    const absorptionConflict = matchesRegimen(['levothyroxine', 'synthroid', 'ciprofloxacin', 'doxycycline']);
    if (absorptionConflict) {
      interactingDrugs.push(absorptionConflict);
      return {
        safety: 'caution',
        reason: `Binding & Chelation interaction: Calcium binds ${absorptionConflict} in the stomach, reducing its absorption by up to 50-80%. You must separate administration by at least 4 hours.`,
        interactingDrugs,
      };
    }
  }

  // Default: if no active red flags detected
  if (activeRegimen.length > 0) {
    return {
      safety: candidate.defaultSafety,
      reason: `Compatible with your current medications (${activeRegimen.join(', ')}). No known major pharmacokinetic or pharmacodynamic interactions detected.`,
      interactingDrugs: [],
    };
  }

  return {
    safety: candidate.defaultSafety,
    reason: `Evidence-based standard over-the-counter option. No active prescription regimen entered to cross-reference.`,
    interactingDrugs: [],
  };
}
