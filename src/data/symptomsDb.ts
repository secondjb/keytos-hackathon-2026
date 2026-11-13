import type { SymptomCorrelation } from '../types/rxcheck';

export interface SymptomDefinition {
  id: string;
  label: string;
  isRedFlag: boolean;
  category: 'cardiovascular' | 'neurological' | 'gastrointestinal' | 'general' | 'allergic';
  associatedKeywords: string[]; // matches drug names or interaction mechanisms
  emergencyActionText: string;
}

export const COMMON_SYMPTOMS: SymptomDefinition[] = [
  {
    id: 'unusual_bleeding',
    label: 'Unusual bleeding, large bruises, or dark/tarry stools',
    isRedFlag: true,
    category: 'gastrointestinal',
    associatedKeywords: ['warfarin', 'aspirin', 'anticoagulant', 'bleeding', 'ibuprofen', 'plavix', 'eliquis', 'xarelto', 'hemorrhage'],
    emergencyActionText: '🚨 CRITICAL EMERGENCY: You may be experiencing internal or gastrointestinal bleeding. Seek emergency medical attention (call 911 or visit the nearest ER) immediately.',
  },
  {
    id: 'chest_pain',
    label: 'Chest pain, tightness, or severe shortness of breath',
    isRedFlag: true,
    category: 'cardiovascular',
    associatedKeywords: ['cocaine', 'adderall', 'amphetamine', 'arrhythmia', 'heart', 'tachycardia', 'lisinopril', 'blood pressure'],
    emergencyActionText: '🚨 CRITICAL EMERGENCY: Acute chest pain can signal myocardial ischemia or cardiovascular crisis. Call emergency services (911) immediately.',
  },
  {
    id: 'respiratory_depression',
    label: 'Extreme drowsiness, slow/shallow breathing, inability to wake',
    isRedFlag: true,
    category: 'neurological',
    associatedKeywords: ['opioid', 'alcohol', 'xanax', 'benzodiazepine', 'respiratory', 'sedation', 'oxycodone', 'kratom'],
    emergencyActionText: '🚨 LIFE-THREATENING EMERGENCY: Possible opioid or central nervous system overdose. Administer Naloxone (Narcan) if available and call 911 right now.',
  },
  {
    id: 'serotonin_symptoms',
    label: 'High fever, severe tremors, muscle stiffness, or extreme agitation',
    isRedFlag: true,
    category: 'neurological',
    associatedKeywords: ['sertraline', 'mdma', 'ssri', 'serotonin', 'st. john', 'fluoxetine', 'effexor', 'tramadol'],
    emergencyActionText: '🚨 URGENT RED FLAG: Symptoms match Serotonin Syndrome or severe neurotoxicity. Stop taking suspected substances and go to emergency care immediately.',
  },
  {
    id: 'anaphylaxis',
    label: 'Swelling of face, lips, tongue, or throat / difficulty swallowing',
    isRedFlag: true,
    category: 'allergic',
    associatedKeywords: ['amoxicillin', 'penicillin', 'allergy', 'aspirin', 'antibiotic'],
    emergencyActionText: '🚨 SEVERE ALLERGIC REACTION: Possible anaphylaxis. Use an EpiPen if prescribed and seek immediate emergency care.',
  },
  {
    id: 'jaundice',
    label: 'Yellowing of skin or eyes, dark urine, upper stomach pain',
    isRedFlag: true,
    category: 'gastrointestinal',
    associatedKeywords: ['acetaminophen', 'tylenol', 'alcohol', 'liver', 'hepatotoxicity'],
    emergencyActionText: '⚠️ URGENT MEDICAL ATTENTION: Signs of liver inflammation or hepatotoxicity. Contact your physician or poison control center immediately.',
  },
  {
    id: 'dizziness_lightheaded',
    label: 'Dizziness, lightheadedness, or feeling faint upon standing',
    isRedFlag: false,
    category: 'cardiovascular',
    associatedKeywords: ['lisinopril', 'blood pressure', 'sedative', 'cannabis', 'alcohol', 'orthostatic', 'metoprolol'],
    emergencyActionText: '⚠️ WARNING: May indicate acute hypotension (low blood pressure) or drug interaction. Sit or lie down safely. Contact your doctor to evaluate your dosages.',
  },
  {
    id: 'palpitations',
    label: 'Racing, pounding, or irregular heartbeat (palpitations)',
    isRedFlag: false,
    category: 'cardiovascular',
    associatedKeywords: ['caffeine', 'stimulant', 'adderall', 'decongestant', 'pseudoephedrine', 'tachycardia'],
    emergencyActionText: '⚠️ WARNING: Elevated sympathetic activity or arrhythmia risk. Rest in a cool space and consult your physician if symptoms persist.',
  },
  {
    id: 'nausea_vomiting',
    label: 'Persistent nausea, vomiting, or severe abdominal cramps',
    isRedFlag: false,
    category: 'gastrointestinal',
    associatedKeywords: ['metformin', 'antibiotic', 'pain', 'nsaid', 'gastric'],
    emergencyActionText: 'ℹ️ ADVISORY: Common drug side effect, but can cause dehydration or signal gastric irritation. Contact your pharmacist or primary care provider.',
  },
  {
    id: 'muscle_pain',
    label: 'Unexplained muscle pain, tenderness, or weakness',
    isRedFlag: false,
    category: 'general',
    associatedKeywords: ['statin', 'atorvastatin', 'lipitor', 'rhabdomyolysis'],
    emergencyActionText: '⚠️ IMPORTANT: Statin-associated muscle symptoms can occasionally lead to rhabdomyolysis. Mention this to your doctor promptly.',
  },
];

export const correlateSymptoms = (
  selectedSymptomIds: string[],
  activeDrugs: string[],
  interactionMechanisms: string[]
): SymptomCorrelation[] => {
  const normalizedDrugs = activeDrugs.map(d => d.toLowerCase());
  const combinedContext = [...normalizedDrugs, ...interactionMechanisms.map(m => m.toLowerCase())].join(' ');

  const correlations: SymptomCorrelation[] = [];

  for (const symId of selectedSymptomIds) {
    const sym = COMMON_SYMPTOMS.find(s => s.id === symId);
    if (!sym) continue;

    const matchedDrugs: string[] = [];
    for (const kw of sym.associatedKeywords) {
      for (const drug of normalizedDrugs) {
        if (drug.includes(kw) || kw.includes(drug)) {
          if (!matchedDrugs.includes(drug)) matchedDrugs.push(drug);
        }
      }
    }

    const hasContextMatch = sym.associatedKeywords.some(kw => combinedContext.includes(kw));

    if (sym.isRedFlag || matchedDrugs.length > 0 || hasContextMatch) {
      correlations.push({
        symptomName: sym.label,
        severity: sym.isRedFlag ? 'emergency' : 'warning',
        relatedDrugs: matchedDrugs.length > 0 ? matchedDrugs : ['Current medication regimen'],
        alertMessage: sym.emergencyActionText,
        actionRequired: sym.isRedFlag
          ? 'IMMEDIATE EMERGENCY CONSULTATION / 911'
          : 'Consult your prescribing doctor or pharmacist',
      });
    }
  }

  return correlations;
};
