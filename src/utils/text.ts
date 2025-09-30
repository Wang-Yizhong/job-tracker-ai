// --- file: utils/match/text.ts
const STOP = new Set([
  // EN + DE 常见停用词
  "the","and","for","with","to","of","in","on","a","an","as","by","at","from",
  "und","der","die","das","mit","für","oder","ist","sind","von","im","am","zu","bei"
]);

export function tokenize(txt: string) {
  return txt
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(t => t.length >= 2 && !STOP.has(t));
}

export function ngrams(tokens: string[], nList = [1,2,3]) {
  const out: string[] = [];
  for (const n of nList) {
    for (let i=0; i<=tokens.length-n; i++) {
      out.push(tokens.slice(i, i+n).join(" "));
    }
  }
  return out;
}

export function extractKeywords(text: string) {
  const toks = tokenize(text);
  const grams = [...toks, ...ngrams(toks, [2,3])];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const g of grams) {
    if (!seen.has(g)) { seen.add(g); result.push(g); }
  }
  return result;
}
