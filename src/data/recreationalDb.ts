import type { RecreationalAdvisoryItem } from '../types/rxcheck';

export const RECREATIONAL_ADVISORIES: Array<{
  substanceKey: string; // lower-case token to match
  substanceName: string;
  drugClassMatches: string[]; // words in drug name / class
  riskTitle: string;
  severity: 'critical' | 'high' | 'moderate';
  mechanism: string;
  harmReductionAdvice: string;
  symptomsToWatch: string[];
}> = [
  // Alcohol + CNS Depressants (Benzos, Opioids, Sedatives)
  {
    substanceKey: 'alcohol',
    substanceName: 'Alcohol (Ethanol)',
    drugClassMatches: ['alprazolam', 'xanax', 'lorazepam', 'ativan', 'diazepam', 'valium', 'clonazepam', 'klonopin', 'zolpidem', 'ambien', 'oxycodone', 'hydrocodone', 'tramadol', 'morphine', 'fentanyl', 'codeine', 'buprenorphine'],
    riskTitle: 'Severe Central Nervous System & Respiratory Depression',
    severity: 'critical',
    mechanism: 'Both alcohol and sedative medications amplify GABA-A neurotransmission and depress brainstem respiratory centers, drastically elevating the risk of unresponsiveness, respiratory arrest, coma, and accidental death.',
    harmReductionAdvice: 'Avoid mixing alcohol with sedative/opioid medications entirely. Never consume them alone; ensure someone around knows first-aid and has Naloxone (Narcan) accessible if opioids are involved.',
    symptomsToWatch: ['Extreme drowsiness', 'Slow or shallow breathing (< 8 breaths/min)', 'Blue/pale lips or fingertips', 'Inability to stay awake', 'Gurgling sounds / choking'],
  },
  // Alcohol + Anticoagulants / NSAIDs
  {
    substanceKey: 'alcohol',
    substanceName: 'Alcohol (Ethanol)',
    drugClassMatches: ['warfarin', 'coumadin', 'aspirin', 'ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'apixaban', 'eliquis', 'rivaroxaban', 'xarelto', 'clopidogrel', 'plavix'],
    riskTitle: 'Heightened Gastrointestinal Bleeding & Anticoagulant Instability',
    severity: 'high',
    mechanism: 'Alcohol irritates gastric mucosa and impairs platelet function. In combination with anticoagulants or NSAIDs, it significantly heightens the hazard of acute internal stomach ulceration and systemic hemorrhage.',
    harmReductionAdvice: 'Refrain from heavy or binge drinking while on blood thinners. Do not take NSAIDs (ibuprofen, aspirin) to treat alcohol hangovers; speak to your doctor or pharmacist about safer pain relief options.',
    symptomsToWatch: ['Black or tarry stools', 'Vomiting blood or coffee-ground material', 'Unusual large bruising', 'Persistent lightheadedness or dizziness'],
  },
  // Alcohol + Acetaminophen (Tylenol)
  {
    substanceKey: 'alcohol',
    substanceName: 'Alcohol (Ethanol)',
    drugClassMatches: ['acetaminophen', 'tylenol', 'paracetamol', 'percocet', 'vicodin', 'nyquil'],
    riskTitle: 'Acute Hepatotoxicity (Severe Liver Injury)',
    severity: 'high',
    mechanism: 'Chronic or heavy alcohol intake induces CYP2E1 liver enzymes, shifting acetaminophen metabolism toward the toxic intermediate NAPQI, which overwhelms glutathione reserves and triggers liver cell necrosis.',
    harmReductionAdvice: 'Never use acetaminophen to manage post-drinking headaches or hangovers. Strictly limit acetaminophen to well under 2,000 mg/day if alcohol is consumed, and prioritize hydration.',
    symptomsToWatch: ['Pain in the upper right abdomen', 'Nausea and repeated vomiting', 'Yellowing of skin or whites of eyes (jaundice)', 'Dark tea-colored urine'],
  },
  // MDMA / Cocaine + SSRIs / SNRIs / MAOIs
  {
    substanceKey: 'mdma',
    substanceName: 'MDMA (Ecstasy/Molly)',
    drugClassMatches: ['sertraline', 'zoloft', 'fluoxetine', 'prozac', 'escitalopram', 'lexapro', 'citalopram', 'venlafaxine', 'effexor', 'duloxetine', 'cymbalta', 'selegiline', 'phenelzine'],
    riskTitle: 'Life-Threatening Serotonin Syndrome & Hyperthermia',
    severity: 'critical',
    mechanism: 'Combining serotonergic antidepressants with MDMA produces massive intrasynaptic serotonin accumulation, precipitating autonomic instability, neuromuscular hyperreactivity, malignant hyperthermia, and seizures.',
    harmReductionAdvice: 'Do not combine MDMA with SSRIs, SNRIs, or MAOIs. Stopping antidepressant medication abruptly to take MDMA is also dangerous due to withdrawal syndromes and unpredictable rebound effects.',
    symptomsToWatch: ['Rapid heart rate & high fever (> 101°F/38.5°C)', 'Tremors, shivering, or involuntary muscle spasms (clonus)', 'Extreme agitation or confusion', 'Dilated pupils and heavy sweating'],
  },
  // Cocaine + Stimulants / Heart meds
  {
    substanceKey: 'cocaine',
    substanceName: 'Cocaine',
    drugClassMatches: ['adderall', 'amphetamine', 'ritalin', 'methylphenidate', 'pseudoephedrine', 'lisinopril', 'metoprolol', 'amlodipine', 'bupropion', 'wellbutrin'],
    riskTitle: 'Acute Cardiovascular Overdrive & Arrhythmia Hazard',
    severity: 'critical',
    mechanism: 'Cocaine triggers massive norepinephrine and dopamine release and blocks cardiac sodium channels. Combined with prescription stimulants or cardiovascular agents, it can trigger acute myocardial ischemia, coronary vasospasm, and ventricular arrhythmias.',
    harmReductionAdvice: 'Avoid poly-substance stimulant combinations. Seek emergency care immediately if experiencing central crushing chest pain or left-arm numbness.',
    symptomsToWatch: ['Severe chest tightness or crushing pain', 'Racing irregular heartbeat (> 120 bpm at rest)', 'Severe sudden headache', 'Shortness of breath'],
  },
  // Cannabis + Sedatives
  {
    substanceKey: 'cannabis',
    substanceName: 'Cannabis (THC / Weed)',
    drugClassMatches: ['alprazolam', 'xanax', 'lorazepam', 'ativan', 'diazepam', 'valium', 'zolpidem', 'ambien', 'oxycodone', 'hydrocodone', 'tramadol', 'quetiapine', 'seroquel'],
    riskTitle: 'Additive Sedation, Impaired Motor Function & Orthostatic Drops',
    severity: 'moderate',
    mechanism: 'THC and sedative medications have compounding CNS depressant effects, dramatically impairing psychomotor reflexes, cognitive processing, and producing orthostatic hypotension upon standing.',
    harmReductionAdvice: 'Do not drive, operate machinery, or combine high doses. Stand up slowly from sitting or lying down to prevent dizziness or syncopal falls.',
    symptomsToWatch: ['Severe disorientation', 'Dizziness when standing up', 'Extreme lethargy', 'Slurred speech'],
  },
  // Kratom + Opioids / Depressants
  {
    substanceKey: 'kratom',
    substanceName: 'Kratom (Mitragynine)',
    drugClassMatches: ['oxycodone', 'hydrocodone', 'tramadol', 'morphine', 'fentanyl', 'methadone', 'buprenorphine', 'suboxone', 'alprazolam', 'alcohol'],
    riskTitle: 'Synergistic Opioid Agonism & Fatal Overdose Risk',
    severity: 'critical',
    mechanism: 'Kratom alkaloids (mitragynine, 7-hydroxymitragynine) act as partial mu-opioid receptor agonists. Co-ingestion with prescription opioids or depressants markedly elevates respiratory arrest vulnerability.',
    harmReductionAdvice: 'Do not combine Kratom with prescription opioids or alcohol. Have Naloxone on hand in case of accidental respiratory depression.',
    symptomsToWatch: ['Loss of consciousness', 'Extremely shallow breathing', 'Pinpoint pupils', 'Unresponsiveness to vocal/physical stimuli'],
  },
  // St. John's Wort + Antidepressants / Oral Contraceptives / Blood thinners
  {
    substanceKey: "st. john's wort",
    substanceName: "St. John's Wort",
    drugClassMatches: ['sertraline', 'fluoxetine', 'escitalopram', 'venlafaxine', 'warfarin', 'birth control', 'ethinyl estradiol', 'cyclosporine', 'digoxin'],
    riskTitle: 'Potent CYP3A4 / P-gp Induction & Serotonin Syndrome',
    severity: 'high',
    mechanism: "St. John's Wort induces liver enzymes (CYP3A4) reducing bloodstream levels of medications like oral contraceptives and anticoagulants, while simultaneously inhibiting serotonin reuptake causing Serotonin Toxicity when combined with antidepressants.",
    harmReductionAdvice: "Always inform your doctor or pharmacist if using herbal supplements like St. John's Wort, as it causes extensive clinical drug interactions.",
    symptomsToWatch: ['Rapid heartbeat', 'Muscle twitching', 'Unexpected breakthrough bleeding', 'Agitation'],
  },
  // High Caffeine / Energy Drinks + Stimulants / Heart conditions
  {
    substanceKey: 'caffeine',
    substanceName: 'High Caffeine / Energy Drinks',
    drugClassMatches: ['adderall', 'amphetamine', 'ritalin', 'methylphenidate', 'pseudoephedrine', 'ephedrine', 'bupropion', 'wellbutrin', 'ciprofloxacin'],
    riskTitle: 'Compounded Sympathetic Activation & Tachycardia',
    severity: 'moderate',
    mechanism: 'Caffeine antagonizes adenosine receptors and promotes phosphodiesterase inhibition. Combining high-dose caffeine (e.g. pre-workouts, energy drinks) with stimulant medications elevates heart rate and blood pressure significantly.',
    harmReductionAdvice: 'Limit or eliminate energy drinks and high-caffeine supplements if taking stimulant medications or if you have hypertension or arrhythmias.',
    symptomsToWatch: ['Pounding heart palpitations', 'Jitteriness and severe tremors', 'Anxiety / panic feelings', 'Insomnia'],
  },
];

export const checkRecreationalAdvisories = (drugs: string[]): RecreationalAdvisoryItem[] => {
  const normalized = drugs.map(d => d.trim().toLowerCase());
  const results: RecreationalAdvisoryItem[] = [];

  for (const item of RECREATIONAL_ADVISORIES) {
    const hasSubstance = normalized.some(d => d.includes(item.substanceKey));
    if (hasSubstance) {
      // Look for any other drug matching drugClassMatches
      for (const drug of normalized) {
        if (drug.includes(item.substanceKey)) continue;

        const isMatch = item.drugClassMatches.some(m => drug.includes(m.toLowerCase()));
        if (isMatch) {
          const id = `${item.substanceKey}::${drug}`;
          if (!results.some(r => r.id === id)) {
            results.push({
              id,
              substance1: item.substanceName,
              substance2: drug,
              matchedDrug: drug,
              riskTitle: item.riskTitle,
              severity: item.severity,
              mechanism: item.mechanism,
              harmReductionAdvice: item.harmReductionAdvice,
              symptomsToWatch: item.symptomsToWatch,
            });
          }
        }
      }
    }
  }

  return results;
};
