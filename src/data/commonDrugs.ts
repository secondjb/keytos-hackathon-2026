export interface DrugOption {
  name: string;
  category: 'prescription' | 'otc' | 'recreational' | 'supplement';
  genericName?: string;
  commonUses?: string;
}

export const COMMON_DRUGS: DrugOption[] = [
  // Anticoagulants & Antiplatelets
  { name: 'Warfarin', genericName: 'warfarin', category: 'prescription', commonUses: 'Blood thinner / stroke prevention' },
  { name: 'Aspirin', genericName: 'acetylsalicylic acid', category: 'otc', commonUses: 'Pain, fever, heart protection' },
  { name: 'Clopidogrel (Plavix)', genericName: 'clopidogrel', category: 'prescription', commonUses: 'Antiplatelet' },
  { name: 'Apixaban (Eliquis)', genericName: 'apixaban', category: 'prescription', commonUses: 'Novel anticoagulant' },
  { name: 'Rivaroxaban (Xarelto)', genericName: 'rivaroxaban', category: 'prescription', commonUses: 'Novel anticoagulant' },

  // Pain / NSAIDs / Opioids
  { name: 'Ibuprofen (Advil/Motrin)', genericName: 'ibuprofen', category: 'otc', commonUses: 'Pain relief, anti-inflammatory' },
  { name: 'Acetaminophen (Tylenol)', genericName: 'acetaminophen', category: 'otc', commonUses: 'Pain relief & fever reducer' },
  { name: 'Naproxen (Aleve)', genericName: 'naproxen', category: 'otc', commonUses: 'NSAID pain relief' },
  { name: 'Oxycodone', genericName: 'oxycodone', category: 'prescription', commonUses: 'Opioid pain medication' },
  { name: 'Tramadol', genericName: 'tramadol', category: 'prescription', commonUses: 'Opioid pain medication' },

  // Antidepressants & Psychiatric
  { name: 'Sertraline (Zoloft)', genericName: 'sertraline', category: 'prescription', commonUses: 'SSRI antidepressant' },
  { name: 'Fluoxetine (Prozac)', genericName: 'fluoxetine', category: 'prescription', commonUses: 'SSRI antidepressant' },
  { name: 'Escitalopram (Lexapro)', genericName: 'escitalopram', category: 'prescription', commonUses: 'SSRI antidepressant' },
  { name: 'Venlafaxine (Effexor)', genericName: 'venlafaxine', category: 'prescription', commonUses: 'SNRI antidepressant' },
  { name: 'Bupropion (Wellbutrin)', genericName: 'bupropion', category: 'prescription', commonUses: 'Antidepressant / smoking cessation' },
  { name: 'Alprazolam (Xanax)', genericName: 'alprazolam', category: 'prescription', commonUses: 'Benzodiazepine for anxiety' },
  { name: 'Lorazepam (Ativan)', genericName: 'lorazepam', category: 'prescription', commonUses: 'Benzodiazepine' },
  { name: 'Diazepam (Valium)', genericName: 'diazepam', category: 'prescription', commonUses: 'Benzodiazepine' },

  // Cardiovascular & Blood Pressure
  { name: 'Lisinopril', genericName: 'lisinopril', category: 'prescription', commonUses: 'ACE inhibitor for blood pressure' },
  { name: 'Losartan', genericName: 'losartan', category: 'prescription', commonUses: 'ARB for blood pressure' },
  { name: 'Amlodipine (Norvasc)', genericName: 'amlodipine', category: 'prescription', commonUses: 'Calcium channel blocker' },
  { name: 'Metoprolol', genericName: 'metoprolol', category: 'prescription', commonUses: 'Beta-blocker' },
  { name: 'Atorvastatin (Lipitor)', genericName: 'atorvastatin', category: 'prescription', commonUses: 'Statin cholesterol medication' },
  { name: 'Spironolactone', genericName: 'spironolactone', category: 'prescription', commonUses: 'Potassium-sparing diuretic' },

  // Diabetes & Metabolic
  { name: 'Metformin', genericName: 'metformin', category: 'prescription', commonUses: 'Type 2 diabetes' },
  { name: 'Semaglutide (Ozempic/Wegovy)', genericName: 'semaglutide', category: 'prescription', commonUses: 'GLP-1 agonist for diabetes/weight' },

  // Antibiotics & Antifungals
  { name: 'Amoxicillin', genericName: 'amoxicillin', category: 'prescription', commonUses: 'Penicillin antibiotic' },
  { name: 'Azithromycin (Z-Pak)', genericName: 'azithromycin', category: 'prescription', commonUses: 'Macrolide antibiotic' },
  { name: 'Ciprofloxacin', genericName: 'ciprofloxacin', category: 'prescription', commonUses: 'Fluoroquinolone antibiotic' },
  { name: 'Fluconazole (Diflucan)', genericName: 'fluconazole', category: 'prescription', commonUses: 'Antifungal' },

  // Supplements & Herbs
  { name: "St. John's Wort", genericName: "hypericum perforatum", category: 'supplement', commonUses: 'Herbal mood supplement (high CYP3A4 inducer)' },
  { name: 'Potassium Chloride', genericName: 'potassium', category: 'supplement', commonUses: 'Electrolyte supplement' },
  { name: 'Ginkgo Biloba', genericName: 'ginkgo biloba', category: 'supplement', commonUses: 'Herbal cognitive supplement (bleeding risk)' },
  { name: 'Melatonin', genericName: 'melatonin', category: 'supplement', commonUses: 'Sleep aid' },

  // Recreational & Lifestyle Substances
  { name: 'Alcohol (Ethanol)', genericName: 'alcohol', category: 'recreational', commonUses: 'Beer, wine, liquor' },
  { name: 'Cannabis (THC / Weed)', genericName: 'cannabis', category: 'recreational', commonUses: 'Cannabinoids / marijuana' },
  { name: 'CBD (Cannabidiol)', genericName: 'cannabidiol', category: 'supplement', commonUses: 'Cannabinoid supplement' },
  { name: 'Cocaine', genericName: 'cocaine', category: 'recreational', commonUses: 'CNS stimulant' },
  { name: 'MDMA (Ecstasy/Molly)', genericName: 'mdma', category: 'recreational', commonUses: 'Entactogen / stimulant' },
  { name: 'Nicotine / Vapes', genericName: 'nicotine', category: 'recreational', commonUses: 'Cigarettes, pouches, e-cigarettes' },
  { name: 'Caffeine / Energy Drinks', genericName: 'caffeine', category: 'recreational', commonUses: 'Coffee, pre-workout, energy drinks' },
  { name: 'Kratom', genericName: 'mitragyna speciosa', category: 'recreational', commonUses: 'Opioid receptor agonist herb' },
  { name: 'Psilocybin (Mushrooms)', genericName: 'psilocybin', category: 'recreational', commonUses: 'Psychedelic' },
];
