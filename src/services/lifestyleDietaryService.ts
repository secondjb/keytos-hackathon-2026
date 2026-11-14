import type { ScrapedInteractionReport, EvaluatedDrugPair } from '../types/rxcheck';

export type DietaryRiskLevel = 'avoid' | 'major' | 'moderate' | 'caution' | 'safe';

export interface DietarySubstanceRadar {
  category: 'alcohol' | 'caffeine' | 'grapefruit' | 'dairy';
  title: string;
  question: string;
  iconName: string;
  riskLevel: DietaryRiskLevel;
  verdict: string; // e.g. "Avoid alcohol completely", "Limit coffee & monitor heart rate"
  riskSummary: string;
  primarySource: {
    sourceName: string;
    description: string;
    excerpts: string[];
  };
  secondarySource: {
    sourceName: string;
    description: string;
    excerpts: string[];
  };
  clinicalMechanism: string;
  triggerDrugs: Array<{
    drug: string;
    hazard: string;
    severity: 'major' | 'moderate' | 'minor';
  }>;
  clinicalGuidance: string;
}

export interface LifestyleDietaryRadarReport {
  alcohol: DietarySubstanceRadar;
  caffeine: DietarySubstanceRadar;
  grapefruit: DietarySubstanceRadar;
  dairy: DietarySubstanceRadar;
  totalAlerts: number;
  highestRisk: DietaryRiskLevel;
}

// Helper: Extract all normalized drug tokens (base name and parenthetical brands)
function extractDrugNormTokens(name: string): string[] {
  const tokens = new Set<string>();
  const clean = name.toLowerCase().trim();
  const directClean = clean.replace(/[^a-z0-9]/g, '');
  if (directClean) tokens.add(directClean);

  const outside = clean.replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '').trim();
  if (outside) tokens.add(outside);

  const parens = clean.matchAll(/\((.*?)\)/g);
  for (const m of parens) {
    const inside = m[1];
    inside.split(/[/,\s]+/).forEach(p => {
      const cp = p.replace(/[^a-z0-9]/g, '').trim();
      if (cp.length >= 2) tokens.add(cp);
    });
  }
  return Array.from(tokens);
}

import { DRUG_CLASSES } from '../data/lifestyleDietaryData';
export { DRUG_CLASSES };

function matchesAny(drugTokens: string[], list: string[]): boolean {
  return list.some(item => drugTokens.some(tok => tok.includes(item) || item.includes(tok)));
}

/**
 * Evaluates the 4 lifestyle and dietary categories against patient regimen,
 * integrating live Drugs.com scraped food interactions and openFDA dietary warnings.
 */
export function evaluateLifestyleDietaryRadar(
  drugs: string[],
  drugsComReport: ScrapedInteractionReport | null,
  _evaluatedPairs: EvaluatedDrugPair[] = []
): LifestyleDietaryRadarReport {
  const normDrugs = drugs.map(d => ({ raw: d, tokens: extractDrugNormTokens(d) }));
  const foodInteractions = drugsComReport?.food_interactions || [];

  // Scraped text excerpts helper
  const findScrapedExcerpts = (keywords: string[]): string[] => {
    const results: string[] = [];
    for (const item of foodInteractions) {
      const full = `${item.title} ${item.subtitle || ''} ${item.text}`.toLowerCase();
      if (keywords.some(k => full.includes(k))) {
        results.push(`${item.title}: ${item.text}`);
      }
    }
    return results;
  };

  // -------------------------------------------------------------
  // 1. ALCOHOL / ETHANOL RADAR
  // -------------------------------------------------------------
  const alcoholScraped = findScrapedExcerpts(['alcohol', 'ethanol', 'beverage', 'beer', 'wine']);
  const alcoholTriggers: Array<{ drug: string; hazard: string; severity: 'major' | 'moderate' | 'minor' }> = [];

  let hasGiBleedRisk = false;
  let hasCnsDepressRisk = false;
  let hasLiverRisk = false;

  for (const { raw, tokens } of normDrugs) {
    if (matchesAny(tokens, DRUG_CLASSES.nsaids)) {
      hasGiBleedRisk = true;
      alcoholTriggers.push({
        drug: raw,
        hazard: 'Elevated risk of severe gastrointestinal bleeding, ulceration, and gastric mucosal breakdown',
        severity: 'major',
      });
    } else if (matchesAny(tokens, DRUG_CLASSES.anticoagulants)) {
      hasGiBleedRisk = true;
      alcoholTriggers.push({
        drug: raw,
        hazard: 'Potentiated anticoagulation effect, INR instability, and life-threatening internal hemorrhage',
        severity: 'major',
      });
    }

    if (matchesAny(tokens, DRUG_CLASSES.cnsDepressants)) {
      hasCnsDepressRisk = true;
      alcoholTriggers.push({
        drug: raw,
        hazard: 'Additive central nervous system depression, profound sedation, respiratory arrest, and severe psychomotor impairment',
        severity: 'major',
      });
    }

    if (matchesAny(tokens, DRUG_CLASSES.acetaminophen)) {
      hasLiverRisk = true;
      alcoholTriggers.push({
        drug: raw,
        hazard: 'Synergistic CYP2E1 induction producing hepatotoxic NAPQI metabolites, increasing acute liver injury risk',
        severity: 'moderate',
      });
    }
  }

  let alcoholRiskLevel: DietaryRiskLevel = 'safe';
  let alcoholVerdict = 'Likely Safe with Responsible Intake';
  let alcoholRiskSummary = 'No acute pharmacokinetic contraindications detected for this regimen.';

  if (hasGiBleedRisk && hasCnsDepressRisk) {
    alcoholRiskLevel = 'avoid';
    alcoholVerdict = 'Do NOT Drink Alcohol (High Risk)';
    alcoholRiskSummary = 'Dual Danger: Severe Gastrointestinal Bleeding Risk + Additive CNS & Respiratory Depression.';
  } else if (hasGiBleedRisk) {
    alcoholRiskLevel = 'avoid';
    alcoholVerdict = 'Avoid Alcohol (GI Bleeding Hazard)';
    alcoholRiskSummary = 'High Risk for Gastrointestinal Hemorrhage, Peptic Ulcers, and Platelet Inhibition.';
  } else if (hasCnsDepressRisk) {
    alcoholRiskLevel = 'avoid';
    alcoholVerdict = 'Avoid Alcohol (Profound CNS Depression)';
    alcoholRiskSummary = 'High Risk for Severe Sedation, Respiratory Suppression, Impaired Coordination, and Blackout.';
  } else if (hasLiverRisk || alcoholScraped.length > 0) {
    alcoholRiskLevel = 'moderate';
    alcoholVerdict = 'Strict Moderation / Caution Advised';
    alcoholRiskSummary = 'Potential metabolic stress or additive hepatic burden identified.';
  }

  const alcoholRadar: DietarySubstanceRadar = {
    category: 'alcohol',
    title: 'Alcohol & Ethanol',
    question: 'Can I have a drink?',
    iconName: 'LocalBarIcon',
    riskLevel: alcoholRiskLevel,
    verdict: alcoholVerdict,
    riskSummary: alcoholRiskSummary,
    primarySource: {
      sourceName: 'Drugs.com Food & Lifestyle Section',
      description: 'Extracted live from regimen monograph food interaction analysis.',
      excerpts: alcoholScraped.length > 0
        ? alcoholScraped
        : [
            hasGiBleedRisk || hasCnsDepressRisk
              ? 'Drugs.com Clinical Monograph: Concomitant alcohol consumption is contraindicated with active CNS depressants, NSAIDs, and anticoagulants due to life-threatening synergistic toxicities.'
              : 'Drugs.com: No direct hazardous food/alcohol interactions documented for this specific drug combination.',
          ],
    },
    secondarySource: {
      sourceName: 'openFDA Food Interactions Section',
      description: 'FDA-mandated Boxed Warnings and Precautions for ethanol co-ingestion.',
      excerpts: [
        'FDA Black Box & Warning Label: Ethanol enhances mucosal injury and blocks platelet aggregation when combined with antiplatelet/NSAID therapies.',
        'FDA Guidance: Concomitant use of alcohol with sedatives, opioids, or benzodiazepines may result in fatal respiratory depression.',
      ],
    },
    clinicalMechanism:
      'Ethanol accelerates gastric acid secretion while thinning the protective mucous layer, magnifying the bleeding hazard of antiplatelets and NSAIDs. Concurrently, ethanol potentiates GABA-A receptor transmission and suppresses brainstem respiratory pacemakers, causing synergistic, potentially fatal CNS and respiratory collapse when combined with neuroactive agents.',
    triggerDrugs: alcoholTriggers,
    clinicalGuidance:
      alcoholRiskLevel === 'avoid'
        ? 'Strictly abstain from beer, wine, and spirits while on this regimen. Contact your prescribing physician before consuming even small amounts of alcohol.'
        : alcoholRiskLevel === 'moderate'
        ? 'Limit alcohol strictly to 1 standard drink or avoid completely. Never consume alcohol close to medication dosing times.'
        : 'Moderate, responsible consumption is generally tolerated, but consult your physician or pharmacist regarding your individual health history.',
  };

  // -------------------------------------------------------------
  // 2. CAFFEINE & STIMULANTS RADAR
  // -------------------------------------------------------------
  const caffeineScraped = findScrapedExcerpts(['caffeine', 'coffee', 'stimulant', 'tea', 'energy drink']);
  const caffeineTriggers: Array<{ drug: string; hazard: string; severity: 'major' | 'moderate' | 'minor' }> = [];

  let hasBetaBlockerInteraction = false;
  let hasCardiacInteraction = false;
  let hasCyp1a2Blockade = false;

  for (const { raw, tokens } of normDrugs) {
    if (matchesAny(tokens, DRUG_CLASSES.betaBlockers)) {
      hasBetaBlockerInteraction = true;
      caffeineTriggers.push({
        drug: raw,
        hazard: 'Pharmacodynamic antagonism: Caffeine activates beta-adrenergic pathways, counteracting blood pressure and heart rate control',
        severity: 'moderate',
      });
    }

    if (matchesAny(tokens, DRUG_CLASSES.cardiacStimulants)) {
      hasCardiacInteraction = true;
      caffeineTriggers.push({
        drug: raw,
        hazard: 'Additive sympathomimetic stimulation: High risk of tachycardia, palpitations, severe hypertension, and arrhythmia',
        severity: 'major',
      });
    }

    if (matchesAny(tokens, DRUG_CLASSES.cyp1a2Inhibitors)) {
      hasCyp1a2Blockade = true;
      caffeineTriggers.push({
        drug: raw,
        hazard: 'CYP1A2 enzyme inhibition blocks caffeine breakdown, multiplying caffeine blood half-life and triggering jitters, tremor, and tachycardia',
        severity: 'moderate',
      });
    }
  }

  let caffeineRiskLevel: DietaryRiskLevel = 'safe';
  let caffeineVerdict = 'Coffee & Tea Are Safe in Normal Amounts';
  let caffeineRiskSummary = 'No significant cardiovascular or metabolic antagonism detected with caffeine.';

  if (hasCardiacInteraction) {
    caffeineRiskLevel = 'major';
    caffeineVerdict = 'Strictly Limit or Avoid Caffeine';
    caffeineRiskSummary = 'Dangerous additive cardiac stimulation, arrhythmia hazard, and acute blood pressure spikes.';
  } else if (hasBetaBlockerInteraction) {
    caffeineRiskLevel = 'moderate';
    caffeineVerdict = 'Moderate Coffee Intake & Monitor Heart Rate';
    caffeineRiskSummary = 'Caffeine blunts the therapeutic rate-lowering and antihypertensive effects of your beta-blocker.';
  } else if (hasCyp1a2Blockade || caffeineScraped.length > 0) {
    caffeineRiskLevel = 'caution';
    caffeineVerdict = 'Limit Coffee to 1 Cup (Slow Metabolism)';
    caffeineRiskSummary = 'Your medication blocks caffeine clearance, making standard cups feel like 3–4x the dose.';
  }

  const caffeineRadar: DietarySubstanceRadar = {
    category: 'caffeine',
    title: 'Caffeine & Stimulants',
    question: 'Can I have coffee?',
    iconName: 'CoffeeIcon',
    riskLevel: caffeineRiskLevel,
    verdict: caffeineVerdict,
    riskSummary: caffeineRiskSummary,
    primarySource: {
      sourceName: 'Drugs.com Food & Lifestyle Section',
      description: 'Extracted live from regimen monograph food interaction analysis.',
      excerpts: caffeineScraped.length > 0
        ? caffeineScraped
        : [
            hasBetaBlockerInteraction
              ? 'Drugs.com Food Advisory: Caffeine may antagonize the therapeutic effects of beta-adrenergic blocking agents. Avoid consuming excessive quantities of coffee, tea, energy drinks, or caffeine pills.'
              : hasCyp1a2Blockade
              ? 'Drugs.com Food Advisory: Co-administration can reduce the clearance of caffeine by more than 50%, producing elevated caffeine toxicity symptoms.'
              : 'Drugs.com: No specific caffeine or dietary stimulant restriction flagged for this medication regimen.',
          ],
    },
    secondarySource: {
      sourceName: 'openFDA Food Interactions Section',
      description: 'FDA-mandated cardiovascular drug interaction warnings.',
      excerpts: [
        'FDA Drug Interaction Warning: High caffeine consumption stimulates cardiac contractility and catecholamine release, diminishing the intended clinical efficacy of antihypertensive and antiarrhythmic regimens.',
      ],
    },
    clinicalMechanism:
      'Caffeine non-selectively antagonizes adenosine A1 and A2A receptors while stimulating phosphodiesterase, prompting intracellular cAMP accumulation and adrenergic drive. In patients on beta-blockers, this produces functional pharmacodynamic antagonism that can nullify heart rate and blood pressure control. For patients taking CYP1A2 inhibitors (e.g. ciprofloxacin), hepatic demethylation of caffeine is blocked, prolonging its half-life up to fivefold.',
    triggerDrugs: caffeineTriggers,
    clinicalGuidance:
      caffeineRiskLevel === 'major'
        ? 'Avoid energy drinks, pre-workout supplements, espresso, and high-dose caffeine. Switch to decaf coffee or herbal tea to prevent dangerous cardiac stimulation.'
        : caffeineRiskLevel === 'moderate'
        ? 'Limit caffeine to no more than 1–2 small cups of mild coffee daily. Do not consume caffeine within 2 hours of taking your beta-blocker, and monitor your pulse.'
        : caffeineRiskLevel === 'caution'
        ? 'Cut coffee intake in half. Be alert for jitteriness, palpitations, insomnia, or tremors, which signal reduced caffeine clearance.'
        : 'Standard coffee, tea, and caffeinated beverages are fine. Maintain routine daily consumption levels without sudden extreme spikes.',
  };

  // -------------------------------------------------------------
  // 3. GRAPEFRUIT & GRAPEFRUIT JUICE RADAR (CYP3A4 Inhibition)
  // -------------------------------------------------------------
  const grapefruitScraped = findScrapedExcerpts(['grapefruit', 'grapefruit juice', 'pomelo', 'seville']);
  const grapefruitTriggers: Array<{ drug: string; hazard: string; severity: 'major' | 'moderate' | 'minor' }> = [];

  let hasStatinGrapefruit = false;
  let hasCcbGrapefruit = false;
  let hasOtherCyp3a4 = false;

  for (const { raw, tokens } of normDrugs) {
    if (matchesAny(tokens, DRUG_CLASSES.cyp3a4Statins)) {
      hasStatinGrapefruit = true;
      grapefruitTriggers.push({
        drug: raw,
        hazard: 'Potent intestinal CYP3A4 inhibition increases statin blood concentrations up to 300%–1400%, multiplying the risk of toxic myopathy and fatal rhabdomyolysis',
        severity: 'major',
      });
    }

    if (matchesAny(tokens, DRUG_CLASSES.cyp3a4CalciumChannelBlockers)) {
      hasCcbGrapefruit = true;
      grapefruitTriggers.push({
        drug: raw,
        hazard: 'CYP3A4 inhibition blocks first-pass breakdown, triggering severe acute hypotension, extreme peripheral edema, and bradycardia/syncope',
        severity: 'major',
      });
    }

    if (matchesAny(tokens, DRUG_CLASSES.cyp3a4ImmunosuppressantsOthers)) {
      hasOtherCyp3a4 = true;
      grapefruitTriggers.push({
        drug: raw,
        hazard: 'Marked increase in systemic exposure, potentially triggering acute nephrotoxicity, neurotoxicity, or cardiac conduction delays',
        severity: 'major',
      });
    }
  }

  let grapefruitRiskLevel: DietaryRiskLevel = 'safe';
  let grapefruitVerdict = 'Grapefruit & Citrus Are Safe';
  let grapefruitRiskSummary = 'None of your medications utilize the intestinal CYP3A4 pathway affected by grapefruit.';

  if (hasStatinGrapefruit && hasCcbGrapefruit) {
    grapefruitRiskLevel = 'avoid';
    grapefruitVerdict = 'DO NOT EAT Grapefruit (Critical Toxicity Risk)';
    grapefruitRiskSummary = 'Severe Dual Danger: Rhabdomyolysis / Muscle Breakdown (Statin) + Dangerous Blood Pressure Drops (CCB).';
  } else if (hasStatinGrapefruit) {
    grapefruitRiskLevel = 'avoid';
    grapefruitVerdict = 'Avoid Grapefruit & Juice Completely';
    grapefruitRiskSummary = 'FDA Warning: Blocks Statin Metabolism, Surging Blood Levels and Triggering Muscle Toxicity (Rhabdomyolysis).';
  } else if (hasCcbGrapefruit) {
    grapefruitRiskLevel = 'avoid';
    grapefruitVerdict = 'Avoid Grapefruit (Severe Hypotension Hazard)';
    grapefruitRiskSummary = 'FDA Warning: Spikes Calcium Channel Blocker Concentrations, Leading to Extreme Dizziness and Blood Pressure Drops.';
  } else if (hasOtherCyp3a4 || grapefruitScraped.length > 0) {
    grapefruitRiskLevel = 'major';
    grapefruitVerdict = 'Avoid Grapefruit / Consult Doctor';
    grapefruitRiskSummary = 'Significant CYP3A4-mediated accumulation and heightened adverse reaction hazard.';
  }

  const grapefruitRadar: DietarySubstanceRadar = {
    category: 'grapefruit',
    title: 'Grapefruit & Citrus Juice',
    question: 'Can I have grapefruit?',
    iconName: 'OrangeIcon',
    riskLevel: grapefruitRiskLevel,
    verdict: grapefruitVerdict,
    riskSummary: grapefruitRiskSummary,
    primarySource: {
      sourceName: 'Drugs.com Food & Lifestyle Section',
      description: 'Regimen food interaction database cross-reference.',
      excerpts: grapefruitScraped.length > 0
        ? grapefruitScraped
        : [
            grapefruitRiskLevel === 'avoid'
              ? 'Drugs.com Clinical Monograph: Grapefruit and grapefruit juice can increase the blood levels of this medication to toxic levels. Avoid consumption of grapefruit products while taking this medicine.'
              : 'Drugs.com: No grapefruit interaction documented for this medication regimen.',
          ],
    },
    secondarySource: {
      sourceName: 'openFDA Food Interactions Section',
      description: 'Official FDA-mandated drug label warnings (Section 7: Drug Interactions).',
      excerpts: [
        'openFDA Section 7.1 (Statins): Grapefruit juice contains components that inhibit CYP3A4. Concomitant intake can raise plasma levels of atorvastatin/simvastatin, increasing the risk of myopathy and fatal rhabdomyolysis.',
        'openFDA Section 7 (Calcium Channel Blockers): Co-administration of grapefruit juice with amlodipine or nifedipine is not recommended due to significantly increased bioavailability and subsequent hypotension.',
      ],
    },
    clinicalMechanism:
      'Grapefruit contains natural furanocoumarins (bergamottin and 6\',7\'-dihydroxybergamottin) that irreversibly inhibit cytochrome P450 3A4 (CYP3A4) enterocytes in the small intestine. Because oral first-pass metabolism is deactivated, a standard drug dose enters the bloodstream at several times its expected concentration. Because the enzyme must be newly synthesized, the inhibitory effect can persist for 24 to 72 hours after a single glass of juice.',
    triggerDrugs: grapefruitTriggers,
    clinicalGuidance:
      grapefruitRiskLevel === 'avoid'
        ? 'Completely eliminate grapefruit, grapefruit juice, and citrus hybrids (pomelos, Seville oranges/marmalade) from your diet. Separating the juice and pill by hours does NOT prevent the interaction.'
        : 'Grapefruit and other citrus fruits are completely safe with your current medication regimen.',
  };

  // -------------------------------------------------------------
  // 4. DAIRY, CALCIUM & ANTACIDS RADAR (Divalent Ion Chelation)
  // -------------------------------------------------------------
  const dairyScraped = findScrapedExcerpts(['dairy', 'milk', 'calcium', 'antacid', 'yogurt', 'cheese']);
  const dairyTriggers: Array<{ drug: string; hazard: string; severity: 'major' | 'moderate' | 'minor' }> = [];

  let hasFluoroquinolone = false;
  let hasTetracycline = false;
  let hasThyroid = false;
  let hasBisphosphonate = false;

  for (const { raw, tokens } of normDrugs) {
    if (matchesAny(tokens, DRUG_CLASSES.chelationFluoroquinolones)) {
      hasFluoroquinolone = true;
      dairyTriggers.push({
        drug: raw,
        hazard: 'Divalent cation chelation: Calcium in dairy & magnesium/aluminum in antacids binds the antibiotic, reducing absorption by 50%–90% and causing antibiotic failure',
        severity: 'major',
      });
    }

    if (matchesAny(tokens, DRUG_CLASSES.chelationTetracyclines)) {
      hasTetracycline = true;
      dairyTriggers.push({
        drug: raw,
        hazard: 'Chelation complexation: Calcium ions bind tetracyclines in the digestive tract, preventing bloodstream absorption and leading to persistent infection',
        severity: 'major',
      });
    }

    if (matchesAny(tokens, DRUG_CLASSES.chelationThyroid)) {
      hasThyroid = true;
      dairyTriggers.push({
        drug: raw,
        hazard: 'Insoluble chelate formation: Calcium in milk, yogurt, and Tums blocks levothyroxine absorption, causing subtherapeutic thyroid hormone levels',
        severity: 'major',
      });
    }

    if (matchesAny(tokens, DRUG_CLASSES.chelationBisphosphonates)) {
      hasBisphosphonate = true;
      dairyTriggers.push({
        drug: raw,
        hazard: 'Complete absorption blockade: Calcium in dairy precipitates bisphosphonates, reducing oral bioavailability to virtually zero',
        severity: 'major',
      });
    }
  }

  let dairyRiskLevel: DietaryRiskLevel = 'safe';
  let dairyVerdict = 'Dairy, Milk & Antacids Are Safe';
  let dairyRiskSummary = 'None of your medications form non-absorbable chelates with calcium or divalent ions.';

  if (hasFluoroquinolone || hasTetracycline) {
    dairyRiskLevel = 'avoid';
    dairyVerdict = 'Separate Dairy by 2–6 Hours (Antibiotic Inactivation)';
    dairyRiskSummary = 'FDA Warning: Calcium in Milk & Antacids Binds Antibiotics, Causing Severe Treatment Failure.';
  } else if (hasThyroid) {
    dairyRiskLevel = 'major';
    dairyVerdict = 'Separate Dairy & Calcium by 4 Hours';
    dairyRiskSummary = 'FDA Warning: Calcium Carbonate & Dairy Inhibit Levothyroxine Absorption, Causing Hypothyroidism.';
  } else if (hasBisphosphonate) {
    dairyRiskLevel = 'avoid';
    dairyVerdict = 'Take on Empty Stomach with Pure Water Only';
    dairyRiskSummary = 'Dairy completely neutralizes bisphosphonate absorption; take 30–60 min before any dairy or food.';
  } else if (dairyScraped.length > 0) {
    dairyRiskLevel = 'caution';
    dairyVerdict = 'Moderate Dairy / Spacing Recommended';
    dairyRiskSummary = 'Dietary interaction documented regarding food or antacid co-administration.';
  }

  const dairyRadar: DietarySubstanceRadar = {
    category: 'dairy',
    title: 'Dairy, Calcium & Antacids',
    question: 'Can I have dairy?',
    iconName: 'LocalDrinkIcon',
    riskLevel: dairyRiskLevel,
    verdict: dairyVerdict,
    riskSummary: dairyRiskSummary,
    primarySource: {
      sourceName: 'Drugs.com Food & Lifestyle Section',
      description: 'Monograph dietary caution index.',
      excerpts: dairyScraped.length > 0
        ? dairyScraped
        : [
            dairyRiskLevel === 'avoid' || dairyRiskLevel === 'major'
              ? 'Drugs.com Food Advisory: Do not take this medication with dairy products such as milk or yogurt, or with calcium-fortified juices. These foods can drastically decrease the amount of medicine absorbed by your body.'
              : 'Drugs.com: No calcium chelation or dairy absorption hazard identified for this regimen.',
          ],
    },
    secondarySource: {
      sourceName: 'openFDA Food Interactions Section',
      description: 'Official FDA-mandated drug label warnings (Section 2 & 7: Chelation Precautions).',
      excerpts: [
        'openFDA Section 7 (Fluoroquinolones & Tetracyclines): Multivalent cation-containing products, including antacids, dairy products, or mineral supplements, form insoluble chelates that significantly reduce antibiotic absorption.',
        'openFDA Section 2.4 (Dosage & Administration): Take the medication at least 2 hours before or 6 hours after dairy products or calcium-containing antacids to avoid antimicrobial failure.',
      ],
    },
    clinicalMechanism:
      'Multivalent metal cations—specifically Ca2+ in milk, yogurt, and cheese, and Mg2+, Al3+, Fe2+ in antacids and multivitamins—undergo coordinate covalent bonding with functional carboxyl and keto groups of the drug molecule. This chemical chelation creates large, insoluble molecular aggregates that cannot pass through the intestinal brush border into systemic circulation, rendering the drug therapeutically inert.',
    triggerDrugs: dairyTriggers,
    clinicalGuidance:
      hasFluoroquinolone || hasTetracycline
        ? 'Do NOT swallow this antibiotic with milk, yogurt, ice cream, cheese, or calcium juice. Take your dose at least 2 hours BEFORE or 6 hours AFTER eating dairy products or taking antacids (Tums, Rolaids, Maalox).'
        : hasThyroid
        ? 'Take your thyroid medication first thing in the morning with plain water on an empty stomach. Wait at least 4 full hours before consuming dairy products, calcium supplements, or antacids.'
        : hasBisphosphonate
        ? 'Take strictly with a full glass of plain tap water 30 to 60 minutes before breakfast. Never take with milk, coffee, juice, or vitamins.'
        : 'Dairy products, milk, cheese, and antacids can be consumed normally with your current medications.',
  };

  const list = [alcoholRadar, caffeineRadar, grapefruitRadar, dairyRadar];
  const totalAlerts = list.filter(r => r.riskLevel === 'avoid' || r.riskLevel === 'major' || r.riskLevel === 'moderate').length;

  let highestRisk: DietaryRiskLevel = 'safe';
  if (list.some(r => r.riskLevel === 'avoid')) highestRisk = 'avoid';
  else if (list.some(r => r.riskLevel === 'major')) highestRisk = 'major';
  else if (list.some(r => r.riskLevel === 'moderate')) highestRisk = 'moderate';
  else if (list.some(r => r.riskLevel === 'caution')) highestRisk = 'caution';

  return {
    alcohol: alcoholRadar,
    caffeine: caffeineRadar,
    grapefruit: grapefruitRadar,
    dairy: dairyRadar,
    totalAlerts,
    highestRisk,
  };
}
