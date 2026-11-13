import type {
  OtcCategory,
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
// Comprehensive Clinical Catalog: Categories, Ailments & OTC Candidates
// ---------------------------------------------------------------------------
export const OTC_CATEGORIES: OtcCategory[] = [
  {
    id: 'cold_flu',
    name: 'Cold, Flu & Respiratory',
    description: 'Nasal congestion, acute coughing, sore throat, and seasonal viral symptoms',
    iconName: 'CoronavirusIcon',
    ailments: [
      {
        id: 'nasal_congestion',
        categoryId: 'cold_flu',
        name: 'Nasal Congestion & Sinus Pressure',
        iconName: 'AirIcon',
        summary: 'Swollen nasal passages and sinus headache from common colds or allergies.',
        recommendedCandidates: [
          {
            id: 'oxymetazoline',
            name: 'Oxymetazoline Nasal Spray',
            genericName: 'Oxymetazoline Hydrochloride',
            brandExamples: ['Afrin', 'Dristan', 'Vicks Sinex'],
            drugClass: 'Topical Alpha-1 Decongestant',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'oxymetazoline',
            mechanismSummary: 'Acts locally on nasal mucosal vessels with minimal systemic absorption, sparing blood pressure.',
            dosageGuidance: '2-3 sprays per nostril every 10-12 hours. Maximum 3 consecutive days to avoid rebound rhinitis.',
            keyContraindications: ['maoi'],
            cautionNotes: 'Strictly limit to 3 days to prevent rebound congestion (rhinitis medicamentosa).',
          },
          {
            id: 'saline_rinse',
            name: 'Saline Nasal Irrigation',
            genericName: 'Sodium Chloride 0.9% Solution',
            brandExamples: ['NeilMed Sinus Rinse', 'Simply Saline', 'Ocean Spray'],
            drugClass: 'Mechanical Mucus Clearance / Isotonic Rinse',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'sodium chloride',
            mechanismSummary: 'Physically thins and flushes trapped mucus and allergens without any pharmacologic drug interactions.',
            dosageGuidance: 'Use 1-2 times daily with distilled or sterile water.',
            keyContraindications: [],
            cautionNotes: 'Always use distilled, sterile, or previously boiled water—never plain tap water.',
          },
          {
            id: 'pseudoephedrine',
            name: 'Pseudoephedrine Oral',
            genericName: 'Pseudoephedrine Hydrochloride',
            brandExamples: ['Sudafed', 'SudoGest'],
            drugClass: 'Systemic Sympathomimetic Decongestant',
            defaultSafety: 'caution',
            fdaSubstanceQuery: 'pseudoephedrine',
            mechanismSummary: 'Stimulates alpha- and beta-adrenergic receptors, causing potent vasoconstriction and bronchodilation.',
            dosageGuidance: '30-60 mg every 4-6 hours (max 240 mg/day). Available behind the pharmacy counter.',
            keyContraindications: ['lisinopril', 'losartan', 'amlodipine', 'metoprolol', 'hypertension', 'maoi'],
            cautionNotes: 'Raises systemic blood pressure and heart rate. Avoid if you take blood pressure medications.',
          },
          {
            id: 'phenylephrine',
            name: 'Phenylephrine Oral',
            genericName: 'Phenylephrine Hydrochloride',
            brandExamples: ['Sudafed PE', 'DayQuil Decongestant'],
            drugClass: 'Systemic Alpha-1 Agonist',
            defaultSafety: 'caution',
            fdaSubstanceQuery: 'phenylephrine',
            mechanismSummary: 'Direct alpha-1 adrenergic stimulant. FDA advisory committees noted poor oral bioavailability.',
            dosageGuidance: '10 mg every 4 hours as needed.',
            keyContraindications: ['lisinopril', 'amlodipine', 'maoi'],
            cautionNotes: 'May trigger elevated blood pressure or palpitations; consider nasal sprays instead.',
          },
        ],
      },
      {
        id: 'dry_cough',
        categoryId: 'cold_flu',
        name: 'Dry, Hacking Cough',
        iconName: 'RecordVoiceOverIcon',
        summary: 'Non-productive, tickling cough that disrupts sleep and daily activity.',
        recommendedCandidates: [
          {
            id: 'dextromethorphan',
            name: 'Dextromethorphan (DM)',
            genericName: 'Dextromethorphan Hydrobromide',
            brandExamples: ['Delsym', 'Robitussin DM', 'Buckley’s'],
            drugClass: 'Centrally-Acting Antitussive',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'dextromethorphan',
            mechanismSummary: 'Suppresses the medullary cough reflex center without significant opioid analgesia at standard doses.',
            dosageGuidance: '30 mg extended-release every 12 hours, or 10-20 mg every 4 hours (max 120 mg/day).',
            keyContraindications: ['sertraline', 'fluoxetine', 'escitalopram', 'duloxetine', 'paroxetine', 'maoi', 'ssri', 'snri'],
            cautionNotes: 'Has mild serotonergic properties; combining with SSRIs/SNRIs risks Serotonin Syndrome.',
          },
          {
            id: 'honey_lozenges',
            name: 'Honey & Zinc Demulcent Lozenges',
            genericName: 'Pectin & Honey Complex',
            brandExamples: ['Halls Honey-Lemon', 'Ricola', 'Zand Herbal'],
            drugClass: 'Demulcent Throat Soother',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'pectin',
            mechanismSummary: 'Coats irritated sensory nerve endings in the pharynx, breaking the reflex cough trigger.',
            dosageGuidance: 'Dissolve 1 lozenge slowly in mouth every 2 hours as needed.',
            keyContraindications: [],
            cautionNotes: 'Safe for all medication regimens. Do not give raw honey to infants under 1 year.',
          },
          {
            id: 'guaifenesin_cough',
            name: 'Guaifenesin Extended-Release',
            genericName: 'Guaifenesin',
            brandExamples: ['Mucinex', 'Robitussin'],
            drugClass: 'Expectorant',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'guaifenesin',
            mechanismSummary: 'Increases the volume and reduces the viscosity of respiratory secretions, easing cough clearance.',
            dosageGuidance: '600-1200 mg every 12 hours with a full glass of water.',
            keyContraindications: [],
            cautionNotes: 'Drink plenty of water; hydration is essential for expectorant efficacy.',
          },
        ],
      },
      {
        id: 'sore_throat',
        categoryId: 'cold_flu',
        name: 'Sore Throat & Pharyngitis',
        iconName: 'HealingIcon',
        summary: 'Painful swallowing, scratchiness, and inflammation of the throat mucosa.',
        recommendedCandidates: [
          {
            id: 'acetaminophen_throat',
            name: 'Acetaminophen (Tylenol)',
            genericName: 'Acetaminophen / Paracetamol',
            brandExamples: ['Tylenol Extra Strength', 'Mapap'],
            drugClass: 'Central Analgesic / Antipyretic',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'acetaminophen',
            mechanismSummary: 'Inhibits central prostaglandin synthesis. Does not impair platelet aggregation or irritate gastric mucosa.',
            dosageGuidance: '500-1000 mg every 4-6 hours. Do not exceed 3,000 mg in 24 hours.',
            keyContraindications: ['percocet', 'vicodin', 'norco', 'tylenol with codeine'],
            cautionNotes: 'Preferred pain reliever for patients taking anticoagulants, ACE inhibitors, or with history of ulcers.',
          },
          {
            id: 'benzocaine_lozenges',
            name: 'Benzocaine & Menthol Lozenges',
            genericName: 'Benzocaine / Menthol',
            brandExamples: ['Cepacol', 'Chloraseptic Sore Throat', 'Vicks VapoDrops'],
            drugClass: 'Topical Local Anesthetic',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'benzocaine',
            mechanismSummary: 'Blocks voltage-gated sodium channels in mucosal sensory neurons, providing rapid numbing relief.',
            dosageGuidance: 'Dissolve 1 lozenge every 2 hours. Do not chew or swallow whole.',
            keyContraindications: [],
            cautionNotes: 'Avoid hot beverages immediately after use due to temporary loss of thermal sensation in mouth.',
          },
          {
            id: 'saltwater_rinse',
            name: 'Hypertonic Warm Saltwater Gargle',
            genericName: 'Hypertonic Saline (NaCl)',
            brandExamples: ['Warm Salt Water', 'Clinical Home Therapy'],
            drugClass: 'Osmotic Demulcent Gargle',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'sodium chloride',
            mechanismSummary: 'Draws excess edema out of inflamed pharyngeal tissues through simple osmotic gradient.',
            dosageGuidance: '1/2 teaspoon table salt in 8 oz warm water. Gargle and spit every 3 hours.',
            keyContraindications: [],
            cautionNotes: 'Zero drug interactions. Spit out after gargling; do not swallow.',
          },
        ],
      },
      {
        id: 'fever_body_aches',
        categoryId: 'cold_flu',
        name: 'Fever & Viral Body Chills',
        iconName: 'ThermostatIcon',
        summary: 'Elevated body temperature, malaise, and generalized joint/muscle achiness.',
        recommendedCandidates: [
          {
            id: 'acetaminophen_fever',
            name: 'Acetaminophen (Tylenol)',
            genericName: 'Acetaminophen',
            brandExamples: ['Tylenol', 'Panadol', 'Feverall'],
            drugClass: 'Antipyretic / Central Analgesic',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'acetaminophen',
            mechanismSummary: 'Resets the hypothalamic thermoregulatory center to reduce fever safely without gastric erosion.',
            dosageGuidance: '650-1000 mg every 6 hours (max 3000 mg/day).',
            keyContraindications: ['severe hepatic impairment'],
            cautionNotes: 'Safe with blood thinners and blood pressure medications. Avoid alcohol while taking.',
          },
          {
            id: 'ibuprofen_fever',
            name: 'Ibuprofen (Advil / Motrin)',
            genericName: 'Ibuprofen',
            brandExamples: ['Advil', 'Motrin IB'],
            drugClass: 'Nonsteroidal Anti-Inflammatory Drug (NSAID)',
            defaultSafety: 'caution',
            fdaSubstanceQuery: 'ibuprofen',
            mechanismSummary: 'Inhibits COX-1 and COX-2 enzymes, suppressing peripheral inflammatory prostaglandin synthesis.',
            dosageGuidance: '200-400 mg every 4-6 hours with food or milk (max 1200 mg/day OTC).',
            keyContraindications: ['warfarin', 'eliquis', 'xarelto', 'plavix', 'lisinopril', 'losartan', 'aspirin', 'anticoagulant'],
            cautionNotes: 'High interaction risk with blood thinners (GI bleeding) and blood pressure meds (kidney stress).',
          },
        ],
      },
    ],
  },
  {
    id: 'pain_inflammation',
    name: 'Pain, Headache & Inflammation',
    description: 'Tension headaches, migraines, joint stiffness, muscle backaches, and cramps',
    iconName: 'BoltIcon',
    ailments: [
      {
        id: 'tension_headache',
        categoryId: 'pain_inflammation',
        name: 'Tension & Stress Headache',
        iconName: 'PsychologyIcon',
        summary: 'Bilateral band-like pressure around the forehead and neck tension.',
        recommendedCandidates: [
          {
            id: 'acetaminophen_pain',
            name: 'Acetaminophen (Tylenol Regular/Extra)',
            genericName: 'Acetaminophen',
            brandExamples: ['Tylenol', 'Genapap'],
            drugClass: 'Analgesic (Non-Opioid, Non-NSAID)',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'acetaminophen',
            mechanismSummary: 'Blocks pain transmission centrally without interfering with renal prostaglandins or coagulation cascades.',
            dosageGuidance: '500-1000 mg every 4-6 hours as needed (max 3000 mg/day).',
            keyContraindications: [],
            cautionNotes: 'Safest first-line choice for patients on cardiovascular or anticoagulant regimens.',
          },
          {
            id: 'ibuprofen_headache',
            name: 'Ibuprofen (Advil / Motrin)',
            genericName: 'Ibuprofen',
            brandExamples: ['Advil Liqui-Gels', 'Motrin'],
            drugClass: 'NSAID (Prostaglandin Synthetase Inhibitor)',
            defaultSafety: 'caution',
            fdaSubstanceQuery: 'ibuprofen',
            mechanismSummary: 'Inhibits both COX-1 and COX-2 to reduce neurogenic inflammation and vascular pain.',
            dosageGuidance: '200-400 mg every 4-6 hours with a meal.',
            keyContraindications: ['warfarin', 'eliquis', 'xarelto', 'lisinopril', 'losartan', 'prednisone', 'anticoagulant', 'nsaid'],
            cautionNotes: 'May trigger acute GI ulceration with anticoagulants, or blunt antihypertensive efficacy.',
          },
          {
            id: 'naproxen_headache',
            name: 'Naproxen Sodium (Aleve)',
            genericName: 'Naproxen Sodium',
            brandExamples: ['Aleve', 'Naprosyn OTC'],
            drugClass: 'Long-Acting NSAID',
            defaultSafety: 'caution',
            fdaSubstanceQuery: 'naproxen',
            mechanismSummary: 'Provides up to 12-hour continuous COX enzyme inhibition with potent anti-inflammatory duration.',
            dosageGuidance: '220 mg every 8-12 hours with a full glass of water.',
            keyContraindications: ['warfarin', 'eliquis', 'xarelto', 'lisinopril', 'losartan', 'anticoagulant', 'ssri'],
            cautionNotes: 'Long half-life means prolonged bleeding risk if combined with blood thinners or SSRIs.',
          },
          {
            id: 'magnesium_glycinate',
            name: 'Magnesium Glycinate (Chelated)',
            genericName: 'Magnesium Bisglycinate',
            brandExamples: ['Pure Encapsulations', 'Doctor’s Best', 'Nature Made'],
            drugClass: 'Neuromuscular Relaxant Mineral Supplement',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'magnesium',
            mechanismSummary: 'Calms cranial vascular tone, blocks NMDA excitotoxicity, and relaxes pericranial muscle spasms.',
            dosageGuidance: '200-400 mg daily with dinner.',
            keyContraindications: ['ciprofloxacin', 'doxycycline'],
            cautionNotes: 'Take 2-4 hours apart from fluoroquinolone or tetracycline antibiotics.',
          },
        ],
      },
      {
        id: 'joint_arthritis',
        categoryId: 'pain_inflammation',
        name: 'Joint Stiffness & Osteoarthritis',
        iconName: 'AccessibilityNewIcon',
        summary: 'Aching knees, hips, or fingers with mechanical stiffness after immobility.',
        recommendedCandidates: [
          {
            id: 'diclofenac_gel',
            name: 'Topical Diclofenac Gel (Voltaren)',
            genericName: 'Diclofenac Sodium Topical Gel 1%',
            brandExamples: ['Voltaren Arthritis Pain', 'Diclofenac Gel'],
            drugClass: 'Topical NSAID',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'diclofenac',
            mechanismSummary: 'Delivers high local joint tissue concentrations with only 6% of the systemic blood exposure of oral NSAIDs.',
            dosageGuidance: 'Apply 2-4 grams 4 times daily to affected joint for up to 21 days.',
            keyContraindications: ['severe oral nsaid allergy'],
            cautionNotes: 'Significantly safer than oral NSAIDs for cardiovascular and GI risks, but still avoid combining with multiple oral NSAIDs.',
          },
          {
            id: 'acetaminophen_arthritis',
            name: 'Acetaminophen 8-Hour Arthritis',
            genericName: 'Acetaminophen Extended-Release',
            brandExamples: ['Tylenol 8HR Arthritis', 'Acetaminophen ER'],
            drugClass: 'Non-Opioid Analgesic',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'acetaminophen',
            mechanismSummary: 'Bi-layer tablet releases initial dose rapidly, followed by sustained release for continuous joint relief.',
            dosageGuidance: '650-1300 mg every 8 hours with water (max 3000 mg/day).',
            keyContraindications: [],
            cautionNotes: 'First-line oral choice for osteoarthritis in patients over 65 or taking cardiac medications.',
          },
          {
            id: 'capsaicin_cream',
            name: 'Capsaicin Topical Cream',
            genericName: 'Capsaicin 0.025% - 0.075%',
            brandExamples: ['Capzasin-HP', 'Zostrix'],
            drugClass: 'Substance P Depleting Counterirritant',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'capsaicin',
            mechanismSummary: 'Depletes substance P from peripheral nociceptors, dampening chronic pain signal transmission.',
            dosageGuidance: 'Apply a thin film to painful joint 3-4 times daily. Requires 1-2 weeks of continuous use for full efficacy.',
            keyContraindications: [],
            cautionNotes: 'Wash hands thoroughly with soap after applying; avoid contact with eyes and mucous membranes.',
          },
        ],
      },
      {
        id: 'muscle_backache',
        categoryId: 'pain_inflammation',
        name: 'Muscle Spasm & Lower Back Strain',
        iconName: 'FitnessCenterIcon',
        summary: 'Acute paraspinal muscle tightening, lumbosacral soreness, or exercise strain.',
        recommendedCandidates: [
          {
            id: 'menthol_patch',
            name: 'Menthol & Camphor Pain Relief Patch',
            genericName: 'Menthol / Methyl Salicylate',
            brandExamples: ['Salonpas Pain Relief Patch', 'Icy Hot Patch'],
            drugClass: 'Topical Counterirritant & Analgesic',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'menthol',
            mechanismSummary: 'Stimulates TRPM8 cold-sensitive receptors to trigger sensory distraction and gate-control analgesia.',
            dosageGuidance: 'Apply 1 patch to clean, dry skin for up to 8 hours (max 1 patch per site at a time).',
            keyContraindications: [],
            cautionNotes: 'Do not use with an external heating pad, as severe skin burns may occur.',
          },
          {
            id: 'naproxen_muscle',
            name: 'Naproxen Sodium (Aleve)',
            genericName: 'Naproxen Sodium',
            brandExamples: ['Aleve', 'All Day Pain Relief'],
            drugClass: 'NSAID',
            defaultSafety: 'caution',
            fdaSubstanceQuery: 'naproxen',
            mechanismSummary: 'Long-lasting peripheral anti-inflammatory action that reduces muscle tissue edema.',
            dosageGuidance: '220 mg twice daily with food.',
            keyContraindications: ['warfarin', 'eliquis', 'lisinopril', 'kidney disease'],
            cautionNotes: 'Check for blood pressure and kidney interactions before taking.',
          },
        ],
      },
    ],
  },
  {
    id: 'digestive_gi',
    name: 'Digestive & Gastrointestinal',
    description: 'Heartburn, acid reflux, nausea, diarrhea, constipation, and abdominal bloating',
    iconName: 'RestaurantIcon',
    ailments: [
      {
        id: 'heartburn_gerd',
        categoryId: 'digestive_gi',
        name: 'Heartburn & Acid Reflux (GERD)',
        iconName: 'WhatshotIcon',
        summary: 'Substernal burning sensation after meals or when lying down.',
        recommendedCandidates: [
          {
            id: 'calcium_carbonate',
            name: 'Calcium Carbonate Antacid (Tums)',
            genericName: 'Calcium Carbonate',
            brandExamples: ['Tums Chewy Bites', 'Rolaids', 'Maalox'],
            drugClass: 'Chemical Acid Neutralizer',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'calcium carbonate',
            mechanismSummary: 'Directly neutralizes gastric hydrochloric acid on contact, yielding calcium chloride, water, and CO2.',
            dosageGuidance: 'Chew 2-4 tablets as symptoms occur. Max 7 tablets in 24 hours.',
            keyContraindications: ['ciprofloxacin', 'levothyroxine'],
            cautionNotes: 'Space at least 2 to 4 hours apart from thyroid medications (Levothyroxine) or fluoroquinolones.',
          },
          {
            id: 'famotidine',
            name: 'Famotidine (Pepcid AC)',
            genericName: 'Famotidine',
            brandExamples: ['Pepcid AC', 'Zantac 360', 'Fluxid'],
            drugClass: 'Histamine H2-Receptor Antagonist',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'famotidine',
            mechanismSummary: 'Competitively blocks H2 receptors on parietal cells, inhibiting basal and nocturnal gastric acid secretion.',
            dosageGuidance: '10-20 mg once or twice daily, taken 15-60 minutes before trigger meals.',
            keyContraindications: [],
            cautionNotes: 'Safest systemic acid reducer with far fewer drug-drug interactions than cimetidine or PPIs.',
          },
          {
            id: 'omeprazole',
            name: 'Omeprazole Delayed-Release (Prilosec)',
            genericName: 'Omeprazole Magnesium',
            brandExamples: ['Prilosec OTC', 'Zegerid'],
            drugClass: 'Proton Pump Inhibitor (PPI)',
            defaultSafety: 'caution',
            fdaSubstanceQuery: 'omeprazole',
            mechanismSummary: 'Irreversibly inhibits the H+/K+ ATPase pump, dramatically reducing 24-hour gastric acid.',
            dosageGuidance: '20 mg once daily before breakfast for a 14-day course (max 3 courses per year).',
            keyContraindications: ['clopidogrel', 'plavix'],
            cautionNotes: 'Competes with CYP2C19. Strongly interferes with Plavix (clopidogrel) activation!',
          },
        ],
      },
      {
        id: 'nausea_upset',
        categoryId: 'digestive_gi',
        name: 'Nausea & Motion Sickness',
        iconName: 'SickIcon',
        summary: 'Queasiness, vestibular motion sickness, or general upset stomach.',
        recommendedCandidates: [
          {
            id: 'ginger_extract',
            name: 'Standardized Ginger Root Extract',
            genericName: 'Zingiber officinale (Gingerols)',
            brandExamples: ['Dramamine Ginger', 'Gravol Natural Source', 'Nature’s Way Ginger'],
            drugClass: 'Phytotherapeutic Antiemetic',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'ginger',
            mechanismSummary: 'Active gingerols and shogaols antagonize 5-HT3 and cholinergic receptors in the GI tract.',
            dosageGuidance: '500-1000 mg 30 minutes before travel or with light meals.',
            keyContraindications: [],
            cautionNotes: 'Zero sedative side effects. Safe for daytime driving and work.',
          },
          {
            id: 'meclizine',
            name: 'Meclizine Hydrochloride (Less Drowsy)',
            genericName: 'Meclizine HCl',
            brandExamples: ['Dramamine Less Drowsy', 'Bonine', 'Antivert OTC'],
            drugClass: 'Antihistamine / Antiemetic',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'meclizine',
            mechanismSummary: 'Depresses labyrinthine excitability and vestibular stimulation with less sedation than dimenhydrinate.',
            dosageGuidance: '25-50 mg once daily, taken 1 hour before motion exposure.',
            keyContraindications: ['alprazolam', 'clonazepam', 'opioid', 'cns depressants'],
            cautionNotes: 'May cause mild drowsiness. Avoid alcohol and heavy sedatives while taking.',
          },
          {
            id: 'bismuth_nausea',
            name: 'Bismuth Subsalicylate (Pepto-Bismol)',
            genericName: 'Bismuth Subsalicylate',
            brandExamples: ['Pepto-Bismol', 'Kaopectate'],
            drugClass: 'Gastrointestinal Protectant / Antidiarrheal',
            defaultSafety: 'caution',
            fdaSubstanceQuery: 'bismuth subsalicylate',
            mechanismSummary: 'Coats stomach lining and hydrolyzes to salicylic acid, offering mild antimicrobial and antisecretory effects.',
            dosageGuidance: '30 mL or 2 chewable tablets every 30-60 minutes as needed (max 8 doses/day).',
            keyContraindications: ['warfarin', 'eliquis', 'aspirin', 'anticoagulant', 'children fever'],
            cautionNotes: 'Contains salicylate! Contraindicated with blood thinners and in children/teens with fever (Reye’s Syndrome). Causes harmless temporary dark tongue/stool.',
          },
        ],
      },
      {
        id: 'constipation_gi',
        categoryId: 'digestive_gi',
        name: 'Occasional Constipation & Hard Stools',
        iconName: 'TimerOffIcon',
        summary: 'Infrequent bowel movements, straining, or dry, hard stool passage.',
        recommendedCandidates: [
          {
            id: 'polyethylene_glycol',
            name: 'Polyethylene Glycol 3350 (MiraLAX)',
            genericName: 'Polyethylene Glycol 3350',
            brandExamples: ['MiraLAX', 'Gavilax', 'ClearLax'],
            drugClass: 'Osmotic Laxative',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'polyethylene glycol 3350',
            mechanismSummary: 'Draws water directly into the stool through osmotic retention, softening stool without stimulating cramping.',
            dosageGuidance: '17 grams (1 capful) dissolved in 4-8 oz of any beverage once daily.',
            keyContraindications: [],
            cautionNotes: 'First-line clinical choice. Does not cause electrolyte depletion or dependency like stimulant laxatives.',
          },
          {
            id: 'docusate_sodium',
            name: 'Docusate Sodium (Colace)',
            genericName: 'Docusate Sodium',
            brandExamples: ['Colace', 'Surfak'],
            drugClass: 'Stool Softener (Emollient Surfactant)',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'docusate sodium',
            mechanismSummary: 'Lowers surface tension at the oil-water interface, enabling water and fatty lipids to penetrate stool.',
            dosageGuidance: '100 mg 1-2 times daily with a full glass of water.',
            keyContraindications: ['mineral oil'],
            cautionNotes: 'Gentle and non-irritating. Do not administer concurrently with mineral oil.',
          },
        ],
      },
    ],
  },
  {
    id: 'allergies_sinus',
    name: 'Allergies & Sinus',
    description: 'Seasonal pollen allergies, allergic rhinitis, itchy eyes, and acute histamine hives',
    iconName: 'SpaIcon',
    ailments: [
      {
        id: 'seasonal_allergies',
        categoryId: 'allergies_sinus',
        name: 'Seasonal Allergies & Hay Fever',
        iconName: 'WbSunnyIcon',
        summary: 'Sneezing, itchy palate, runny nose, and allergic conjunctivitis.',
        recommendedCandidates: [
          {
            id: 'cetirizine',
            name: 'Cetirizine (Zyrtec)',
            genericName: 'Cetirizine Hydrochloride',
            brandExamples: ['Zyrtec', 'Alleroff'],
            drugClass: 'Second-Generation H1 Antihistamine',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'cetirizine',
            mechanismSummary: 'Selectively blocks peripheral H1 histamine receptors with minimal penetration of the blood-brain barrier.',
            dosageGuidance: '10 mg once daily in the evening.',
            keyContraindications: [],
            cautionNotes: 'Very effective with low sedation; approximately 10% of users experience mild drowsiness.',
          },
          {
            id: 'fexofenadine',
            name: 'Fexofenadine (Allegra)',
            genericName: 'Fexofenadine Hydrochloride',
            brandExamples: ['Allegra Allergy 24HR'],
            drugClass: 'Non-Sedating H1 Antihistamine',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'fexofenadine',
            mechanismSummary: 'Zero blood-brain barrier crossing; 100% non-sedating even at supratherapeutic doses.',
            dosageGuidance: '180 mg once daily with water.',
            keyContraindications: [],
            cautionNotes: 'Do not take with grapefruit, apple, or orange juice (fruit juices decrease intestinal OATP absorption by up to 70%).',
          },
          {
            id: 'fluticasone_nasal',
            name: 'Fluticasone Propionate Nasal (Flonase)',
            genericName: 'Fluticasone Propionate',
            brandExamples: ['Flonase Allergy Relief', 'ClariSpray'],
            drugClass: 'Intranasal Corticosteroid',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'fluticasone propionate',
            mechanismSummary: 'Inhibits multiple inflammatory cytokines and cellular mediators directly in the nasal mucosa.',
            dosageGuidance: '2 sprays in each nostril once daily for 1 week, then 1-2 sprays daily.',
            keyContraindications: [],
            cautionNotes: 'Most potent single treatment for allergic rhinitis. Takes 2-4 days of daily use for full clinical peak.',
          },
        ],
      },
      {
        id: 'allergic_eyes',
        categoryId: 'allergies_sinus',
        name: 'Allergic Itchy & Watery Eyes',
        iconName: 'VisibilityIcon',
        summary: 'Bilateral eye redness, stinging, tearing, and itching from airborne allergens.',
        recommendedCandidates: [
          {
            id: 'ketotifen_drops',
            name: 'Ketotifen Fumarate Eye Drops (Zaditor)',
            genericName: 'Ketotifen Fumarate Ophthalmic 0.025%',
            brandExamples: ['Zaditor', 'Alaway', 'Claritin Eye'],
            drugClass: 'Ophthalmic H1 Antihistamine & Mast Cell Stabilizer',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'ketotifen',
            mechanismSummary: 'Dual action: blocks H1 receptors immediately and stabilizes conjunctival mast cells against degranulation.',
            dosageGuidance: 'Instill 1 drop in each affected eye twice daily (every 8-12 hours).',
            keyContraindications: [],
            cautionNotes: 'Provides relief within minutes and lasts up to 12 hours. Remove soft contact lenses before instilling.',
          },
          {
            id: 'artificial_tears',
            name: 'Preservative-Free Lubricating Artificial Tears',
            genericName: 'Carboxymethylcellulose / Glycerin',
            brandExamples: ['Refresh Plus', 'Systane Complete', 'Blink Tears'],
            drugClass: 'Ophthalmic Demulcent',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'carboxymethylcellulose',
            mechanismSummary: 'Physically dilutes inflammatory mediators and allergens on the corneal surface while restoring the tear film.',
            dosageGuidance: 'Instill 1-2 drops as needed throughout the day.',
            keyContraindications: [],
            cautionNotes: 'Completely safe with zero pharmacologic drug interactions.',
          },
        ],
      },
    ],
  },
  {
    id: 'sleep_stress',
    name: 'Sleep & Mental Rest',
    description: 'Occasional sleeplessness, jet lag, sleep latency delay, and acute daytime nervous tension',
    iconName: 'BedtimeIcon',
    ailments: [
      {
        id: 'occasional_insomnia',
        categoryId: 'sleep_stress',
        name: 'Occasional Sleeplessness & Jet Lag',
        iconName: 'NightsStayIcon',
        summary: 'Difficulty falling asleep due to disrupted schedule, travel, or occasional racing thoughts.',
        recommendedCandidates: [
          {
            id: 'melatonin',
            name: 'Melatonin (Micro/Low-Dose)',
            genericName: 'Melatonin',
            brandExamples: ['Natrol Melatonin', 'Nature Made', 'Life Extension'],
            drugClass: 'Endogenous Pineal Hormone Agonist',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'melatonin',
            mechanismSummary: 'Binds MT1 and MT2 receptors in the suprachiasmatic nucleus to synchronize circadian phase without morning grogginess.',
            dosageGuidance: '0.5 to 3 mg taken 30-60 minutes before bedtime. (Lower doses 0.5-1mg are often more physiologic).',
            keyContraindications: ['warfarin'],
            cautionNotes: 'Very high safety profile. May have mild additive anticoagulation effects at high doses.',
          },
          {
            id: 'l_theanine_sleep',
            name: 'L-Theanine Supplement',
            genericName: 'L-Theanine (Suntheanine)',
            brandExamples: ['Sports Research L-Theanine', 'NOW L-Theanine'],
            drugClass: 'Amino Acid Neurotransmitter Modulator',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'theanine',
            mechanismSummary: 'Crosses blood-brain barrier to elevate alpha brainwave activity, promoting calm relaxation without sedation.',
            dosageGuidance: '100-200 mg 30-45 minutes before sleep or during periods of acute stress.',
            keyContraindications: [],
            cautionNotes: 'Non-habit-forming, does not induce physical tolerance or motor impairment.',
          },
          {
            id: 'doxylamine',
            name: 'Doxylamine Succinate (Unisom)',
            genericName: 'Doxylamine Succinate',
            brandExamples: ['Unisom SleepTabs'],
            drugClass: 'First-Generation Sedating Antihistamine',
            defaultSafety: 'caution',
            fdaSubstanceQuery: 'doxylamine',
            mechanismSummary: 'Crosses blood-brain barrier to antagonize central H1 receptors and muscarinic receptors.',
            dosageGuidance: '25 mg 30 minutes before bed. For occasional use only (max 2 consecutive weeks).',
            keyContraindications: ['alprazolam', 'clonazepam', 'lorazepam', 'zolpidem', 'opioid', 'cns depressants'],
            cautionNotes: 'Causes significant next-day sedation. Avoid in seniors (Beers criteria: fall risk, urinary retention) and with prescription sedatives.',
          },
        ],
      },
    ],
  },
  {
    id: 'topical_firstaid',
    name: 'Topical & First Aid',
    description: 'Minor cuts, abrasions, burns, poison ivy, and localized bug bite relief',
    iconName: 'MedicationLiquidIcon',
    ailments: [
      {
        id: 'minor_cuts_burns',
        categoryId: 'topical_firstaid',
        name: 'Minor Abrasions, Cuts & Superficial Burns',
        iconName: 'LocalHospitalIcon',
        summary: 'Superficial skin breaks requiring barrier protection and infection prevention.',
        recommendedCandidates: [
          {
            id: 'bacitracin_ointment',
            name: 'Bacitracin & Polymyxin Ointment (Polysporin)',
            genericName: 'Bacitracin Zinc / Polymyxin B',
            brandExamples: ['Polysporin', 'Double Antibiotic Ointment'],
            drugClass: 'Topical Antibiotic Barrier',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'bacitracin',
            mechanismSummary: 'Inhibits bacterial cell wall synthesis locally while maintaining a clean, moist healing bed.',
            dosageGuidance: 'Clean affected area and apply a small amount 1-3 times daily; cover with a sterile bandage.',
            keyContraindications: [],
            cautionNotes: 'Contains no neomycin, significantly reducing the risk of allergic contact dermatitis.',
          },
          {
            id: 'hydrocortisone_cream',
            name: 'Topical Hydrocortisone 1% Cream',
            genericName: 'Hydrocortisone 1%',
            brandExamples: ['Cortizone-10', 'Cortaid'],
            drugClass: 'Mild Topical Corticosteroid',
            defaultSafety: 'safe',
            fdaSubstanceQuery: 'hydrocortisone',
            mechanismSummary: 'Suppresses inflammatory leukocyte infiltration and reduces cutaneous erythema and pruritus.',
            dosageGuidance: 'Apply a thin layer to affected skin 2-4 times daily for up to 7 days.',
            keyContraindications: [],
            cautionNotes: 'For intact skin only; do not apply inside open puncture wounds or to viral/fungal rashes.',
          },
        ],
      },
    ],
  },
];

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
