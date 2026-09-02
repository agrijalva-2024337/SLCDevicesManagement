export function foldSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function matchesSearch(haystack, query) {
  const needle = foldSearch(query);
  if (!needle) return true;
  const text = foldSearch(haystack);
  return needle.split(/\s+/).every((token) => text.includes(token));
}
