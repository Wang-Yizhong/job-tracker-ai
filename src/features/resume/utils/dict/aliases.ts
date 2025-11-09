// --- file: src/features/resume/utils/dict/aliases.ts
// Lightweight token normalization for matching & display.

export const ALIASES: Record<string, string> = {
  // Frontend
  "react": "react",
  "react.js": "react",
  "reactjs": "react",
  "next": "next.js",
  "nextjs": "next.js",
  "next.js": "next.js",
  "vue": "vue.js",
  "vue.js": "vue.js",
  "nuxt": "nuxt.js",
  "nuxt.js": "nuxt.js",
  "angular": "angular",

  // Languages
  "typescript": "typescript",
  "ts": "typescript",
  "javascript": "javascript",
  "js": "javascript",
  "es6": "javascript",

  // Backend
  "node": "nodejs",
  "node.js": "nodejs",
  "nodejs": "nodejs",
  "express": "express",
  "nest": "nest.js",
  "nestjs": "nest.js",
  "nest.js": "nest.js",

  // API
  "rest": "rest api",
  "restful": "rest api",
  "http api": "rest api",
  "graphql": "graphql",
  "apollo": "graphql",

  // DevOps
  "docker": "docker",
  "k8s": "kubernetes",
  "kubernetes": "kubernetes",
  "ci/cd": "ci/cd",
  "pipeline": "ci/cd",
  "gitlab ci": "ci/cd",

  // Cloud
  "aws": "aws",
  "amazon web services": "aws",
  "gcp": "gcp",
  "google cloud": "gcp",
  "azure": "azure",

  // Databases
  "mysql": "mysql",
  "postgres": "postgresql",
  "mongodb": "mongodb",
  "mongo": "mongodb",
  "redis": "redis",

  // Testing
  "jest": "jest",
  "playwright": "playwright",
  "cypress": "cypress",

  // Other
  "spa": "single page application",
  "spa(s)": "single page application",
};

export function normalizeToken(t: string) {
  const k = t.trim().toLowerCase();
  return ALIASES[k] ?? k;
}

export function canonicalizeList(list: string[]) {
  const out = new Set<string>();
  for (const x of list) out.add(normalizeToken(x));
  return Array.from(out);
}
