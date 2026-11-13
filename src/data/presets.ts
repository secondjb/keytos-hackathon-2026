export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  drugs: string[];
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'warfarin_aspirin',
    title: 'Warfarin + Aspirin',
    subtitle: 'High-risk bleeding combination from dataset',
    drugs: ['Warfarin', 'Aspirin'],
  },
  {
    id: 'cardio_polypharmacy',
    title: 'Lisinopril + Spironolactone + Potassium',
    subtitle: '3-drug polypharmacy: N-choose-2 evaluation',
    drugs: ['Lisinopril', 'Spironolactone', 'Potassium Chloride'],
  },
  {
    id: 'recreational_depressant',
    title: 'Ethanol + Alprazolam (Xanax)',
    subtitle: 'Recreational alcohol + prescription sedative',
    drugs: ['Ethanol', 'Alprazolam'],
  },
  {
    id: 'serotonergic',
    title: 'Sertraline + Tramadol',
    subtitle: 'Dual serotonergic medications evaluation',
    drugs: ['Sertraline', 'Tramadol'],
  },
  {
    id: 'unverified_combination',
    title: 'Amoxicillin + Melatonin',
    subtitle: 'Demonstrating no-record-found dataset disclaimer',
    drugs: ['Amoxicillin', 'Melatonin'],
  },
];
