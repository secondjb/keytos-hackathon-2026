import type { EvaluatedDrugPair } from '../types/rxcheck';

const CACHE_PREFIX = 'rxcheck_cache_v1_';

export const getPairKey = (drugA: string, drugB: string): string => {
  const sorted = [drugA.trim().toLowerCase(), drugB.trim().toLowerCase()].sort();
  return `${sorted[0]}::${sorted[1]}`;
};

export const getCachedInteraction = (drugA: string, drugB: string): EvaluatedDrugPair | null => {
  const key = CACHE_PREFIX + getPairKey(drugA, drugB);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const item = JSON.parse(raw) as EvaluatedDrugPair;
    return { ...item, fromCache: true };
  } catch {
    return null;
  }
};

export const setCachedInteraction = (item: EvaluatedDrugPair): void => {
  const key = CACHE_PREFIX + getPairKey(item.drug1, item.drug2);
  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (err) {
    console.warn('Failed to cache RxCheck item to localStorage:', err);
  }
};

export const clearInteractionCache = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore
  }
};
