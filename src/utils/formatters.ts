export interface InteractionTitleItem {
  title: string;
  subtitle?: string;
  applies_to?: string[];
}

/**
 * Formats interaction titles to ensure a plus (' + ') is placed between different interacting drugs.
 * Handles cases where title lacks separator, uses 'and', or where drugs are in applies_to/subtitle.
 */
export function formatInteractionTitle(item: InteractionTitleItem | string | null | undefined): string {
  if (!item) return '';
  const title = typeof item === 'string' ? item : item.title || '';
  if (!title) return '';

  // If already contains ' + ', clean up irregular whitespace and return
  if (title.includes(' + ')) {
    return title.replace(/\s*\+\s*/g, ' + ').trim();
  }

  // If item is an object, check applies_to and subtitle
  if (typeof item === 'object') {
    let drugs = item.applies_to;
    if (!drugs || drugs.length < 2) {
      if (item.subtitle) {
        const cleaned = item.subtitle.replace(/^applies\s+to:\s*/i, '');
        const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          drugs = parts;
        }
      }
    }

    if (drugs && drugs.length >= 2) {
      // Try to find each drug in title while preserving original casing
      let remaining = title;
      const foundParts: string[] = [];
      let matched = true;

      for (const d of drugs) {
        const idx = remaining.toLowerCase().indexOf(d.toLowerCase());
        if (idx !== -1) {
          const matchedStr = remaining.slice(idx, idx + d.length);
          foundParts.push(matchedStr);
          remaining = remaining.slice(idx + d.length).trim();
        } else {
          matched = false;
          break;
        }
      }

      if (matched && foundParts.length === drugs.length) {
        return foundParts.join(' + ');
      }

      return drugs.join(' + ');
    }
  }

  // If title has " and " between drugs (e.g. "ALPRAZolam and oxyCODONE")
  if (/\s+and\s+/i.test(title)) {
    return title.replace(/\s+and\s+/gi, ' + ');
  }

  return title;
}
