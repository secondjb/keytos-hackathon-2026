/**
 * Evidence-based drug class classification tables for lifestyle and dietary interactions:
 * Alcohol, Caffeine, Dairy/Calcium chelation, and Grapefruit CYP3A4 inhibition.
 */
// Drug class matching tables
export const DRUG_CLASSES = {
  // 1. ALCOHOL RISKS
  nsaids: [
    'ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'meloxicam', 'mobic',
    'celecoxib', 'celebrex', 'diclofenac', 'voltaren', 'indomethacin', 'indocin',
    'ketorolac', 'toradol', 'aspirin', 'bayer', 'ecotrin', 'nabumetone', 'sulindac',
  ],
  anticoagulants: [
    'warfarin', 'coumadin', 'jantoven', 'apixaban', 'eliquis', 'rivaroxaban',
    'xarelto', 'clopidogrel', 'plavix', 'dabigatran', 'pradaxa', 'prasugrel',
    'effient', 'ticagrelor', 'brilinta', 'enoxaparin', 'lovenox', 'heparin',
  ],
  cnsDepressants: [
    'alprazolam', 'xanax', 'lorazepam', 'ativan', 'diazepam', 'valium', 'clonazepam',
    'klonopin', 'temazepam', 'restoril', 'zolpidem', 'ambien', 'eszopiclone', 'lunesta',
    'zaleplon', 'sonata', 'oxycodone', 'percocet', 'oxycontin', 'hydrocodone', 'vicodin',
    'norco', 'tramadol', 'ultram', 'codeine', 'morphine', 'fentanyl', 'duragesic',
    'methadone', 'buprenorphine', 'suboxone', 'cyclobenzaprine', 'flexeril', 'baclofen',
    'lioresal', 'tizanidine', 'zanaflex', 'methocarbamol', 'robaxin', 'carisoprodol',
    'soma', 'gabapentin', 'neurontin', 'pregabalin', 'lyrica', 'diphenhydramine',
    'benadryl', 'hydroxyzine', 'vistaril', 'atarax', 'doxylamine', 'unisom',
    'promethazine', 'phenergan', 'trazodone', 'desyrel', 'mirtazapine', 'remeron',
    'amitriptyline', 'elavil', 'nortriptyline', 'pamelor', 'sertraline', 'zoloft',
    'fluoxetine', 'prozac', 'escitalopram', 'lexapro', 'citalopram', 'celexa',
    'paroxetine', 'paxil', 'duloxetine', 'cymbalta', 'venlafaxine', 'effexor',
  ],
  acetaminophen: ['acetaminophen', 'tylenol', 'paracetamol'],

  // 2. CAFFEINE RISKS
  betaBlockers: [
    'metoprolol', 'toprol', 'lopressor', 'atenolol', 'tenormin', 'propranolol',
    'inderal', 'carvedilol', 'coreg', 'bisoprolol', 'zebeta', 'labetalol',
    'trandate', 'nebivolol', 'bystolic', 'nadolol', 'corgard', 'sotalol', 'betapace',
    'timolol',
  ],
  cardiacStimulants: [
    'theophylline', 'theochron', 'aminophylline', 'adenosine', 'adenocard',
    'digoxin', 'lanoxin', 'amiodarone', 'cordarone', 'flecainide', 'tambocor',
    'amphetamine', 'adderall', 'dextroamphetamine', 'dexedrine', 'methylphenidate',
    'ritalin', 'concerta', 'modafinil', 'provigil', 'armodafinil', 'nuvigil',
    'bupropion', 'wellbutrin', 'zyban', 'pseudoephedrine', 'sudafed',
    'phenelzine', 'nardil', 'tranylcypromine', 'parnate', 'selegiline', 'emsam',
  ],
  cyp1a2Inhibitors: [
    'ciprofloxacin', 'cipro', 'fluvoxamine', 'luvox',
  ],

  // 3. GRAPEFRUIT RISKS (CYP3A4 Inhibition)
  cyp3a4Statins: [
    'atorvastatin', 'lipitor', 'simvastatin', 'zocor', 'lovastatin', 'mevacor',
  ],
  cyp3a4CalciumChannelBlockers: [
    'amlodipine', 'norvasc', 'felodipine', 'plendil', 'nifedipine', 'procardia',
    'adalat', 'diltiazem', 'cardizem', 'tiazac', 'verapamil', 'calan', 'verelan',
    'nicardipine', 'cardene', 'nisoldipine', 'sular',
  ],
  cyp3a4ImmunosuppressantsOthers: [
    'cyclosporine', 'neoral', 'sandimmune', 'tacrolimus', 'prograf', 'buspirone',
    'buspar', 'carbamazepine', 'tegretol', 'amiodarone', 'colchicine', 'colcrys',
    'sildenafil', 'viagra', 'tadalafil', 'cialis',
  ],

  // 4. DAIRY & CALCIUM / ANTACIDS CHELATION RISKS
  chelationFluoroquinolones: [
    'ciprofloxacin', 'cipro', 'levofloxacin', 'levaquin', 'moxifloxacin', 'avelox',
    'ofloxacin', 'floxin',
  ],
  chelationTetracyclines: [
    'doxycycline', 'vibramycin', 'doryx', 'minocycline', 'minocin', 'dynacin',
    'tetracycline', 'achromycin',
  ],
  chelationThyroid: [
    'levothyroxine', 'synthroid', 'levoxyl', 'tirosint', 'unithroid', 'euthyrox',
    'liothyronine', 'cytomel', 'armour thyroid', 'nature-throid',
  ],
  chelationBisphosphonates: [
    'alendronate', 'fosamax', 'risedronate', 'actonel', 'ibandronate', 'boniva',
    'zoledronic acid', 'reclast',
  ],
};
