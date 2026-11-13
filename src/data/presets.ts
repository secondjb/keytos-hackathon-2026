export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  drugs: string[];
  suggestedSymptoms?: string[];
  badge: 'major' | 'harm_reduction' | 'multi_drug' | 'no_record';
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'warfarin_aspirin',
    title: 'Warfarin + Aspirin',
    subtitle: 'Classic High-Risk Anticoagulant Interaction',
    drugs: ['Warfarin', 'Aspirin'],
    suggestedSymptoms: ['unusual_bleeding'],
    badge: 'major',
  },
  {
    id: 'three_drug_cardio',
    title: 'Lisinopril + Spironolactone + Potassium',
    subtitle: '3-Drug Multi-Interaction: Hyperkalemia Hazard',
    drugs: ['Lisinopril', 'Spironolactone', 'Potassium Chloride'],
    suggestedSymptoms: ['palpitations', 'dizziness_lightheaded'],
    badge: 'multi_drug',
  },
  {
    id: 'serotonin_syndrome',
    title: "Sertraline + St. John's Wort + Tramadol",
    subtitle: 'Triple Serotonergic Combination Risk',
    drugs: ['Sertraline', "St. John's Wort", 'Tramadol'],
    suggestedSymptoms: ['serotonin_symptoms'],
    badge: 'major',
  },
  {
    id: 'alcohol_sedative',
    title: 'Alcohol + Xanax (Alprazolam)',
    subtitle: 'Recreational & CNS Depressant Warning',
    drugs: ['Alcohol (Ethanol)', 'Alprazolam (Xanax)'],
    suggestedSymptoms: ['respiratory_depression'],
    badge: 'harm_reduction',
  },
  {
    id: 'no_record_safety',
    title: 'Amoxicillin + Vitamin C',
    subtitle: 'Demonstrating "No Record Found != Safe" Guidance',
    drugs: ['Amoxicillin', 'Melatonin'],
    suggestedSymptoms: [],
    badge: 'no_record',
  },
];
