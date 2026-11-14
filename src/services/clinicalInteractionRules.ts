import type { EvaluatedDrugPair } from '../types/rxcheck';
import {
  CLINICAL_ALIASES,
  CLINICAL_RULES,
  type ClinicalRule,
} from '../data/clinicalRules';

export { CLINICAL_ALIASES, CLINICAL_RULES, type ClinicalRule };

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
