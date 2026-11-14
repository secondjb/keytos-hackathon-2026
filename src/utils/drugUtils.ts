import type { RxCheckDrugSearchResult } from '../types/rxcheck';

/**
 * Formats a drug name for clean title-casing display while preserving
 * existing mixed-case brand capitalization.
 */
export function formatDisplayDrugName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  // Preserve mixed case brand names (e.g. "Alprazolam Intensol")
  if (/[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed)) {
    return trimmed;
  }
  return trimmed
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a drug search result or raw string into a clean UI label:
 * e.g., "Tylenol (acetaminophen)"
 */
export const formatDrugLabel = (option: string | RxCheckDrugSearchResult): string => {
  if (typeof option === 'string') return formatDisplayDrugName(option);

  const primary = formatDisplayDrugName(option.name);
  if (option.generic_name && option.generic_name.trim()) {
    const genericClean = formatDisplayDrugName(option.generic_name);
    // If brand name differs from generic, format cleanly as "Brand Name (generic_name)"
    if (primary.toLowerCase() !== genericClean.toLowerCase()) {
      return `${primary} (${genericClean.toLowerCase()})`;
    }
  }
  return primary;
};

/**
 * Extracts normalized active substances and generic components from a formatted drug string.
 */
export function getActiveSubstancesForDrug(drugStr: string): string[] {
  const normalized = drugStr.trim().toLowerCase();
  const results = new Set<string>();

  results.add(normalized);

  const withoutParens = normalized.replace(/\(.*?\)/g, '').trim();
  if (withoutParens) results.add(withoutParens);

  const match = normalized.match(/\((.*?)\)/);
  if (match && match[1]) {
    const inside = match[1].trim();
    if (inside) results.add(inside);
  }

  return Array.from(results);
}

/**
 * Identifies whether a candidate drug is already present in an active regimen,
 * either by direct label match or by overlapping generic active ingredients.
 */
export function findRegimenDuplicate(
  candidate: string | RxCheckDrugSearchResult,
  regimen: string[]
): { isDuplicate: boolean; reason?: string } {
  const candidateLabel = formatDrugLabel(candidate).trim();
  const candidateLower = candidateLabel.toLowerCase();

  // 1. Direct label match
  for (const existing of regimen) {
    if (existing.trim().toLowerCase() === candidateLower) {
      return {
        isDuplicate: true,
        reason: `"${existing}" is already in your regimen list.`,
      };
    }
  }

  // 2. Active ingredient / generic substance overlap
  const candidateSubstances = new Set(getActiveSubstancesForDrug(candidateLabel));
  if (typeof candidate !== 'string' && candidate.generic_name) {
    candidateSubstances.add(candidate.generic_name.trim().toLowerCase());
  }

  for (const existing of regimen) {
    const existingSubstances = getActiveSubstancesForDrug(existing);
    for (const existingSub of existingSubstances) {
      if (candidateSubstances.has(existingSub)) {
        return {
          isDuplicate: true,
          reason: `"${candidateLabel}" shares the same active ingredient (${existingSub}) as "${existing}" in your regimen.`,
        };
      }
    }
  }

  return { isDuplicate: false };
}
