export function foldSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const NO_TOKENS = Object.freeze([]);

export function searchTokens(query) {
  const folded = foldSearch(query);
  if (!folded) return NO_TOKENS;
  return folded.split(' ');
}

export function matchesTokens(foldedHaystack, tokens) {
  if (!tokens?.length) return true;
  const text = foldedHaystack ?? '';
  for (let index = 0; index < tokens.length; index += 1) {
    if (!text.includes(tokens[index])) return false;
  }
  return true;
}

export function matchesSearch(haystack, query) {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;
  return matchesTokens(foldSearch(haystack), tokens);
}
