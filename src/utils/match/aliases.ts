// --- file: utils/match/aliases.ts
export const ALIASES: Record<string, string> = {
  // 前端
  "react": "react", "react.js": "react", "reactjs": "react",
  "next": "next.js", "nextjs": "next.js", "next.js": "next.js",
  "vue": "vue.js", "vue.js": "vue.js", "nuxt": "nuxt.js", "nuxt.js": "nuxt.js",
  "angular": "angular",

  // 语言
  "typescript": "typescript", "ts": "typescript",
  "javascript": "javascript", "js": "javascript", "es6": "javascript",

  // 后端
  "node": "nodejs", "node.js": "nodejs", "nodejs": "nodejs",
  "express": "express", "nest": "nest.js", "nestjs": "nest.js", "nest.js": "nest.js",

  // API
  "rest": "rest api", "restful": "rest api", "http api": "rest api",
  "graphql": "graphql", "apollo": "graphql",

  // DevOps
  "docker": "docker", "k8s": "kubernetes", "kubernetes": "kubernetes",
  "ci/cd": "ci/cd", "pipeline": "ci/cd", "gitlab ci": "ci/cd",

  // 云
  "aws": "aws", "amazon web services": "aws",
  "gcp": "gcp", "google cloud": "gcp",
  "azure": "azure",

  // 数据库
  "mysql": "mysql", "postgres": "postgresql", 
  "mongodb": "mongodb", "mongo": "mongodb", "redis": "redis",

  // 测试
  "jest": "jest", "playwright": "playwright", "cypress": "cypress",

  // 其他
  "spa": "single page application", "spa(s)": "single page application",
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
