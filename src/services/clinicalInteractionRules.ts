import type { EvaluatedDrugPair, SeverityLevel } from '../types/rxcheck';

// Comprehensive brand-to-generic clinical alias dictionary
export const CLINICAL_ALIASES: Record<string, string> = {
  // Anticoagulants & Antiplatelets
  coumadin: 'warfarin',
  jantoven: 'warfarin',
  eliquis: 'apixaban',
  xarelto: 'rivaroxaban',
  pradaxa: 'dabigatran',
  plavix: 'clopidogrel',
  brilinta: 'ticagrelor',
  effient: 'prasugrel',
  lovenox: 'enoxaparin',

  // NSAIDs & Analgesics
  advil: 'ibuprofen',
  motrin: 'ibuprofen',
  'motrin ib': 'ibuprofen',
  nuprin: 'ibuprofen',
  aleve: 'naproxen',
  anaprox: 'naproxen',
  naprosyn: 'naproxen',
  mobic: 'meloxicam',
  celebrex: 'celecoxib',
  voltaren: 'diclofenac',
  cataflam: 'diclofenac',
  toradol: 'ketorolac',
  indocin: 'indomethacin',
  feldene: 'piroxicam',
  relafen: 'nabumetone',
  clinoril: 'sulindac',
  bayer: 'aspirin',
  ecotrin: 'aspirin',
  tylenol: 'acetaminophen',
  paracetamol: 'acetaminophen',
  panadol: 'acetaminophen',
  feverall: 'acetaminophen',

  // Opioids & Combinations
  percocet: 'oxycodone',
  oxycontin: 'oxycodone',
  roxicodone: 'oxycodone',
  vicodin: 'hydrocodone',
  norco: 'hydrocodone',
  lortab: 'hydrocodone',
  ultram: 'tramadol',
  duragesic: 'fentanyl',
  sublimaze: 'fentanyl',
  dilaudid: 'hydromorphone',
  mscontin: 'morphine',

  // Benzodiazepines & Sedatives
  xanax: 'alprazolam',
  niravam: 'alprazolam',
  ativan: 'lorazepam',
  valium: 'diazepam',
  klonopin: 'clonazepam',
  restoril: 'temazepam',
  halcion: 'triazolam',
  ambien: 'zolpidem',
  lunesta: 'eszopiclone',
  sonata: 'zaleplon',

  // SSRIs & SNRIs
  prozac: 'fluoxetine',
  sarafem: 'fluoxetine',
  zoloft: 'sertraline',
  paxil: 'paroxetine',
  celexa: 'citalopram',
  lexapro: 'escitalopram',
  effexor: 'venlafaxine',
  pristiq: 'desvenlafaxine',
  cymbalta: 'duloxetine',
  viibryd: 'vilazodone',
  trintellix: 'vortioxetine',
  wellbutrin: 'bupropion',
  zyban: 'bupropion',

  // Cardiovascular (ACEi, ARBs, Diuretics, Statins)
  prinivil: 'lisinopril',
  zestril: 'lisinopril',
  vasotec: 'enalapril',
  altace: 'ramipril',
  cozaar: 'losartan',
  diovan: 'valsartan',
  benicar: 'olmesartan',
  lasix: 'furosemide',
  microzide: 'hydrochlorothiazide',
  hctz: 'hydrochlorothiazide',
  aldactone: 'spironolactone',
  lipitor: 'atorvastatin',
  crestor: 'rosuvastatin',
  zocor: 'simvastatin',
  pravachol: 'pravastatin',
  lopressor: 'metoprolol',
  toprol: 'metoprolol',
  tenormin: 'atenolol',
  coreg: 'carvedilol',
  norvasc: 'amlodipine',
  cardizem: 'diltiazem',
  calan: 'verapamil',

  // PDE5 & Nitrates
  viagra: 'sildenafil',
  revatio: 'sildenafil',
  cialis: 'tadalafil',
  adcirca: 'tadalafil',
  nitrostat: 'nitroglycerin',
  nitrolingual: 'nitroglycerin',
  imdur: 'isosorbide mononitrate',
  isordil: 'isosorbide dinitrate',

  // Others
  prilosec: 'omeprazole',
  nexium: 'esomeprazole',
  prevacid: 'lansoprazole',
  synthroid: 'levothyroxine',
  levoxyl: 'levothyroxine',
  singulair: 'montelukast',
  cipro: 'ciprofloxacin',
  levaquin: 'levofloxacin',
  zithromax: 'azithromycin',
  biaxin: 'clarithromycin',
};

export interface ClinicalRule {
  id: string;
  name: string;
  severity: SeverityLevel;
  severityScore: number;
  isHighPriority: boolean;
  matchClass1: string[];
  matchClass2: string[];
  clinicalSignificance: string;
  mechanism: string;
  management: string;
  evidenceLevel: string;
  sources: string[];
}

export const CLINICAL_RULES: ClinicalRule[] = [
  // 1. Anticoagulants / Antiplatelets + NSAIDs (MAJOR RISK)
  {
    id: 'anticoagulant_nsaid',
    name: 'Anticoagulant / Antiplatelet + NSAID Hemorrhage Risk',
    severity: 'major',
    severityScore: 4,
    isHighPriority: true,
    matchClass1: [
      'warfarin',
      'coumadin',
      'jantoven',
      'apixaban',
      'eliquis',
      'rivaroxaban',
      'xarelto',
      'dabigatran',
      'pradaxa',
      'clopidogrel',
      'plavix',
      'prasugrel',
      'effient',
      'ticagrelor',
      'brilinta',
      'heparin',
      'enoxaparin',
      'lovenox',
      'aspirin',
    ],
    matchClass2: [
      'ibuprofen',
      'advil',
      'motrin',
      'naproxen',
      'aleve',
      'meloxicam',
      'mobic',
      'celecoxib',
      'celebrex',
      'diclofenac',
      'voltaren',
      'ketorolac',
      'toradol',
      'indomethacin',
      'piroxicam',
      'nabumetone',
      'sulindac',
    ],
    clinicalSignificance: 'High Hemorrhage Risk: Concomitant Anticoagulant & Oral NSAID',
    mechanism:
      'Oral NSAIDs inhibit COX-1 and COX-2 enzymes, impairing platelet aggregation and causing gastric mucosal erosion. Concurrent anticoagulation drastically multiplies the risk of major upper gastrointestinal bleeding, ulcer perforation, and systemic hemorrhaging.',
    management:
      'Avoid combination when possible. For pain or fever, Acetaminophen (Tylenol) or topical analgesics are clinically preferred. If co-administration is medically necessary, co-prescribe gastroprotection (PPI) and monitor INR or hemoglobin closely.',
    evidenceLevel: 'FDA Black Box Warning / Level A Clinical Consensus',
    sources: ['FDA Safety Communication', 'Drugs.com Clinical Interaction Database', 'American College of Gastroenterology'],
  },

  // 2. NSAID + ACEi / ARB / Diuretic ("Triple Whammy" Renal Hazard)
  {
    id: 'nsaid_renaldrug',
    name: 'NSAID + Renin-Angiotensin Antagonist / Diuretic Acute Kidney Injury Hazard',
    severity: 'moderate',
    severityScore: 3,
    isHighPriority: true,
    matchClass1: [
      'ibuprofen',
      'advil',
      'motrin',
      'naproxen',
      'aleve',
      'meloxicam',
      'celecoxib',
      'diclofenac',
      'indomethacin',
      'ketorolac',
    ],
    matchClass2: [
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
    ],
    clinicalSignificance: 'Nephrotoxic Synergy & Antihypertensive Attenuation',
    mechanism:
      'NSAIDs inhibit prostaglandin-mediated afferent renal vasodilation, while ACE inhibitors/ARBs dilate the efferent arteriole, severely reducing glomerular filtration pressure. Concomitant diuretic use causes hypovolemia, precipitating acute kidney injury (AKI) and hyperkalemia.',
    management:
      'Monitor serum creatinine and electrolytes within 1–2 weeks of initiation. Maintain adequate hydration. Consider short-term alternative analgesics (e.g. acetaminophen) to preserve renal perfusion.',
    evidenceLevel: 'Level A Clinical Documentation',
    sources: ['KDIGO Clinical Practice Guideline for Acute Kidney Injury', 'Drugs.com Interaction Monograph'],
  },

  // 3. NSAID + SSRI / SNRI (Synergistic GI Bleeding Risk)
  {
    id: 'nsaid_ssri',
    name: 'NSAID + Serotonergic Antidepressant Bleeding Potentiation',
    severity: 'moderate',
    severityScore: 2,
    isHighPriority: false,
    matchClass1: [
      'ibuprofen',
      'advil',
      'motrin',
      'naproxen',
      'aleve',
      'meloxicam',
      'diclofenac',
      'celecoxib',
      'aspirin',
    ],
    matchClass2: [
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
    ],
    clinicalSignificance: 'Synergistic Upper Gastrointestinal Bleeding Risk',
    mechanism:
      'Platelets rely on serotonin reuptake from plasma for hemostatic function. SSRIs/SNRIs deplete platelet serotonin stores, blunting platelet aggregation. Combined with NSAID-induced gastric mucosal injury, upper GI bleeding risk roughly triples.',
    management:
      'Limit NSAID duration to the minimum necessary course. Take with meals or consider a proton pump inhibitor (PPI) if long-term therapy is indicated.',
    evidenceLevel: 'Level B Epidemiologic & Pharmacologic Evidence',
    sources: ['American Journal of Gastroenterology', 'Drugs.com Clinical Monograph'],
  },

  // 4. NSAID + Systemic Corticosteroids (Severe Peptic Ulcer Hazard)
  {
    id: 'nsaid_corticosteroid',
    name: 'NSAID + Corticosteroid Severe Peptic Ulceration Risk',
    severity: 'major',
    severityScore: 4,
    isHighPriority: true,
    matchClass1: [
      'ibuprofen',
      'advil',
      'motrin',
      'naproxen',
      'aleve',
      'meloxicam',
      'diclofenac',
      'ketorolac',
      'indomethacin',
      'aspirin',
    ],
    matchClass2: [
      'prednisone',
      'prednisolone',
      'dexamethasone',
      'methylprednisolone',
      'hydrocortisone',
      'budesonide',
    ],
    clinicalSignificance: 'Severe Gastric Ulceration & Perforation Hazard',
    mechanism:
      'Corticosteroids decrease gastric mucosal turnover and suppress protective prostaglandin synthesis, synergistically amplifying NSAID-induced mucosal ulceration by more than 4-fold.',
    management:
      'Avoid concomitant oral therapy where possible. If both are required, mandatory gastroprotection with a PPI (e.g., omeprazole) or misoprostol is indicated.',
    evidenceLevel: 'FDA Black Box Warning / Level A Clinical Consensus',
    sources: ['FDA Drug Safety Communication', 'Drugs.com Interaction Database'],
  },

  // 5. Opioids + Benzodiazepines / CNS Depressants (FDA Black Box)
  {
    id: 'opioid_benzodiazepine',
    name: 'Opioid + Benzodiazepine / Sedative-Hypnotic FDA Black Box Warning',
    severity: 'major',
    severityScore: 4,
    isHighPriority: true,
    matchClass1: [
      'tramadol',
      'oxycodone',
      'hydrocodone',
      'morphine',
      'fentanyl',
      'hydromorphone',
      'codeine',
      'methadone',
      'buprenorphine',
    ],
    matchClass2: [
      'alprazolam',
      'xanax',
      'lorazepam',
      'ativan',
      'clonazepam',
      'klonopin',
      'diazepam',
      'valium',
      'temazepam',
      'zolpidem',
      'ambien',
      'eszopiclone',
      'lunesta',
    ],
    clinicalSignificance: 'FDA Black Box Warning: Severe Respiratory Depression, Coma & Death',
    mechanism:
      'Concurrent administration produces profound additive central nervous system (CNS) and respiratory depression mediated by additive GABA-A and mu-opioid receptor stimulation in the brainstem respiratory center.',
    management:
      'Reserve concomitant prescribing only when alternative treatments are inadequate. Limit dosages and durations to the minimum required. Prescribe naloxone rescue therapy and advise caregivers on signs of opioid-induced respiratory depression.',
    evidenceLevel: 'FDA Boxed Warning (Highest Severity)',
    sources: ['FDA Boxed Warning', 'CDC Clinical Practice Guideline for Prescribing Opioids', 'Drugs.com'],
  },

  // 6. Multiple Serotonergic Agents (Serotonin Syndrome)
  {
    id: 'serotonin_syndrome',
    name: 'Dual Serotonergic Modulation: Serotonin Syndrome Risk',
    severity: 'major',
    severityScore: 4,
    isHighPriority: true,
    matchClass1: [
      'sertraline',
      'zoloft',
      'escitalopram',
      'lexapro',
      'citalopram',
      'fluoxetine',
      'paroxetine',
      'duloxetine',
      'cymbalta',
      'venlafaxine',
      'effexor',
    ],
    matchClass2: [
      'tramadol',
      'ultram',
      'dextromethorphan',
      'selegiline',
      'rasagiline',
      'linezolid',
      'methylene blue',
      'st johns wort',
    ],
    clinicalSignificance: 'Potential Life-Threatening Serotonin Syndrome',
    mechanism:
      'Both agents inhibit 5-HT reuptake or degradation, leading to excessive central and peripheral serotonin receptor overstimulation (5-HT1A/2A).',
    management:
      'Monitor for symptoms of serotonin toxicity (hyperreflexia, clonus, tremor, diaphoresis, hyperthermia, agitation). Discontinue serotonergic agents immediately if signs develop.',
    evidenceLevel: 'Level A Clinical Documentation',
    sources: ['FDA Drug Safety Communication', 'Drugs.com Clinical Monograph'],
  },

  // 7. PDE5 Inhibitors + Nitrates (Fatal Hypotension)
  {
    id: 'pde5_nitrate',
    name: 'PDE5 Inhibitor + Nitrate Severe Hypotension Hazard',
    severity: 'major',
    severityScore: 4,
    isHighPriority: true,
    matchClass1: [
      'sildenafil',
      'viagra',
      'revatio',
      'tadalafil',
      'cialis',
      'vardenafil',
      'avanafil',
    ],
    matchClass2: [
      'nitroglycerin',
      'nitrostat',
      'nitrolingual',
      'isosorbide mononitrate',
      'imdur',
      'isosorbide dinitrate',
      'isordil',
      'nitroprusside',
    ],
    clinicalSignificance: 'Absolute Contraindication: Life-Threatening Systemic Hypotension',
    mechanism:
      'Nitrates generate nitric oxide, which stimulates cGMP production. PDE5 inhibitors prevent cGMP breakdown. The resulting supra-physiological cGMP levels cause profound systemic vasodilation, severe hypotension, and potential cardiovascular collapse.',
    management:
      'Concomitant administration is strictly contraindicated. Maintain a minimum washout interval of at least 24 hours (sildenafil, vardenafil) to 48 hours (tadalafil) after PDE5 inhibitor before administering nitrates.',
    evidenceLevel: 'FDA Absolute Contraindication',
    sources: ['FDA Prescribing Information', 'American College of Cardiology Guidelines'],
  },

  // 8. Statin + Strong CYP3A4 Inhibitor / Fibrate (Rhabdomyolysis Hazard)
  {
    id: 'statin_cyp3a4',
    name: 'Statin + Strong CYP3A4 Inhibitor / Fibrate Rhabdomyolysis Risk',
    severity: 'major',
    severityScore: 3,
    isHighPriority: true,
    matchClass1: [
      'simvastatin',
      'zocor',
      'atorvastatin',
      'lipitor',
      'lovastatin',
    ],
    matchClass2: [
      'clarithromycin',
      'biaxin',
      'itraconazole',
      'ketoconazole',
      'gemfibrozil',
      'lopid',
    ],
    clinicalSignificance: 'Severe Myopathy & Rhabdomyolysis Hazard',
    mechanism:
      'CYP3A4 inhibition drastically increases systemic statin exposure (up to 5–10 fold AUC increase), predisposing skeletal myocytes to membrane destabilization, severe myoglobinuria, and acute renal failure.',
    management:
      'Temporarily suspend the statin during antimicrobial therapy, or switch to a non-CYP3A4-metabolized statin (e.g. rosuvastatin, pravastatin) at a reduced dosage. Instruct patient to report unexplained muscle pain or dark urine immediately.',
    evidenceLevel: 'FDA Safety Communication / Level A Evidence',
    sources: ['FDA Safety Alert', 'Drugs.com Interaction Database'],
  },

  // 9. Therapeutic Duplication: Acetaminophen Overdose Hazard
  {
    id: 'apap_duplication',
    name: 'Acetaminophen (APAP) Cumulative Dose Hepatotoxicity Hazard',
    severity: 'major',
    severityScore: 4,
    isHighPriority: true,
    matchClass1: [
      'acetaminophen',
      'tylenol',
      'paracetamol',
    ],
    matchClass2: [
      'percocet',
      'vicodin',
      'norco',
      'lortab',
      'nyquil',
      'dayquil',
      'excedrin',
      'fioricet',
    ],
    clinicalSignificance: 'Severe Hepatotoxicity Hazard from Cumulative APAP Overdose',
    mechanism:
      'Both medications contain acetaminophen as an active ingredient. Cumulative daily intake exceeding 3,000–4,000 mg depletes hepatic glutathione stores, yielding toxic NAPQI accumulation and acute hepatic necrosis.',
    management:
      'Do not combine OTC Acetaminophen (Tylenol) with prescription opioid-acetaminophen combination tablets. Verify that total daily intake from all sources does not exceed 3,000 mg (or 2,000 mg in hepatic impairment).',
    evidenceLevel: 'FDA Black Box Warning (Acetaminophen Hepatotoxicity)',
    sources: ['FDA Boxed Warning', 'American Liver Foundation'],
  },
];

/**
 * Normalizes a drug string into a rich token set:
 * - base text
 * - parenthetical words split by slash/comma/space
 * - clinical brand-to-generic aliases
 */
export function extractDrugTokens(drugStr: string): string[] {
  if (!drugStr) return [];
  const clean = drugStr.trim().toLowerCase();
  const tokens = new Set<string>();

  tokens.add(clean);

  // Strip punctuation and add cleaned phrase
  const phraseClean = clean.replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (phraseClean) tokens.add(phraseClean);

  // Extract base outside parens
  const outside = clean.replace(/\(.*?\)/g, '').trim();
  if (outside) {
    tokens.add(outside);
    outside.split(/[\s-]+/).forEach(w => {
      if (w.length >= 2) tokens.add(w);
    });
  }

  // Extract inside parens and split by /, ,, or space
  const matches = clean.matchAll(/\((.*?)\)/g);
  for (const m of matches) {
    const inside = m[1].trim();
    if (inside) {
      tokens.add(inside);
      inside.split(/[,\s/]+/).forEach(w => {
        const cw = w.trim();
        if (cw.length >= 2) tokens.add(cw);
      });
    }
  }

  // Expand with clinical aliases for all current tokens
  const current = Array.from(tokens);
  for (const tok of current) {
    const alias = CLINICAL_ALIASES[tok];
    if (alias) {
      tokens.add(alias);
    }
  }

  return Array.from(tokens);
}

/**
 * Checks if a drug's token set matches any term in a class list.
 */
function matchesClass(tokens: string[], classTerms: string[]): boolean {
  for (const term of classTerms) {
    const termClean = term.toLowerCase().trim();
    for (const tok of tokens) {
      if (tok === termClean || tok.includes(termClean) || termClean.includes(tok)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Evaluates two drugs against the deterministic clinical rules database.
 * Returns an EvaluatedDrugPair if an interaction is detected, or null otherwise.
 */
export function evaluatePairwiseClinicalRules(
  drug1: string,
  drug2: string
): EvaluatedDrugPair | null {
  const tokens1 = extractDrugTokens(drug1);
  const tokens2 = extractDrugTokens(drug2);

  for (const rule of CLINICAL_RULES) {
    // Check (1 matches class1 AND 2 matches class2) OR (1 matches class2 AND 2 matches class1)
    const forwardMatch = matchesClass(tokens1, rule.matchClass1) && matchesClass(tokens2, rule.matchClass2);
    const reverseMatch = matchesClass(tokens1, rule.matchClass2) && matchesClass(tokens2, rule.matchClass1);

    if (forwardMatch || reverseMatch) {
      return {
        id: `${drug1.toLowerCase()}::${drug2.toLowerCase()}`,
        drug1,
        drug2,
        status: 'interaction_found',
        severity: rule.severity,
        severityScore: rule.severityScore,
        isHighPriority: rule.isHighPriority,
        resolvedDrug1: drug1,
        resolvedDrug2: drug2,
        mechanism: rule.mechanism,
        clinicalSignificance: rule.clinicalSignificance,
        management: rule.management,
        evidenceLevel: rule.evidenceLevel,
        sources: rule.sources,
        disclaimer:
          'Data derived from authoritative clinical consensus and FDA monographs. Verify with prescribing clinician.',
        timestamp: Date.now(),
      };
    }
  }

  return null;
}
