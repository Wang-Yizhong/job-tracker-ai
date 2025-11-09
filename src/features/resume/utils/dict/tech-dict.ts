// --- file: src/features/resume/utils/dict/tech-dict.ts
// Common Web/Backend/Mobile/Data/Cloud/DevOps/Test/Methodology/Tools skills dictionary.
// Use case-insensitive matching. Aliases map into the same canonical label.

export type SkillDef = { label: string; aliases: (string | RegExp)[] };

// NOTE: Keep this file pure (no imports). It is intentionally verbose for coverage.
export const SKILL_DEFS: SkillDef[] = [
  /* Languages / Runtimes */
  { label: "JavaScript", aliases: [/javascript\b/i, /\becma?script\b/i, /\bes6\+?\b/i, /\bes\d+\b/i, /\bjs\b/i] },
  { label: "TypeScript", aliases: [/typescript\b/i, /\bts\b/i] },
  { label: "Node.js", aliases: [/\bnode(\.js)?\b/i, /\bd8\b/i] },
  { label: "Python", aliases: [/python\b/i] },
  { label: "Java", aliases: [/\bjava(?!script)\b/i] },
  { label: "Go", aliases: [/\bgo(lang)?\b/i] },
  { label: "C#", aliases: [/\bc#\b/i, /\b\.net\b/i, /\b\.net core\b/i] },
  { label: "PHP", aliases: [/php\b/i] },
  { label: "Ruby", aliases: [/ruby\b/i, /\bruby on rails\b/i, /\brails\b/i] },
  { label: "Kotlin", aliases: [/kotlin\b/i] },
  { label: "Swift", aliases: [/swift\b/i] },
  { label: "Rust", aliases: [/rust\b/i] },

  /* Frontend Frameworks / Libraries */
  { label: "React", aliases: [/react(\.js)?\b/i] },
  { label: "Next.js", aliases: [/next(\.js)?\b/i, /\bnextjs\b/i] },
  { label: "Redux", aliases: [/redux\b/i, /\bredux\-toolkit\b/i] },
  { label: "React Query", aliases: [/react[-\s]?query\b/i, /\btanstack query\b/i] },
  { label: "Vue.js", aliases: [/\bvue(\.js)?\b/i] },
  { label: "Nuxt.js", aliases: [/nuxt(\.js)?\b/i] },
  { label: "Angular", aliases: [/angular(?!\s*material)\b/i] },
  { label: "Svelte", aliases: [/svelte\b/i] },
  { label: "SolidJS", aliases: [/solid(\.js)?\b/i] },

  /* Web Basics / UI */
  { label: "HTML", aliases: [/html5?\b/i] },
  { label: "CSS", aliases: [/css3?\b/i] },
  { label: "Sass", aliases: [/\bsass\b/i, /\bscss\b/i] },
  { label: "Tailwind CSS", aliases: [/tailwind(\s*css)?\b/i] },
  { label: "Styled Components", aliases: [/styled[-\s]?components\b/i] },
  { label: "MUI", aliases: [/\bmui\b/i, /\bmaterial ui\b/i, /angular material\b/i] },
  { label: "Bootstrap", aliases: [/bootstrap\b/i] },
  { label: "Storybook", aliases: [/storybook\b/i] },
  { label: "Web Components", aliases: [/web components?\b/i, /\blit(element)?\b/i] },

  /* Mobile / Cross-Platform */
  { label: "React Native", aliases: [/react[-\s]?native\b/i] },
  { label: "Flutter", aliases: [/flutter\b/i] },
  { label: "Android", aliases: [/android\b/i] },
  { label: "iOS", aliases: [/\bios\b/i, /\bxcode\b/i, /\buikit\b/i, /\bswiftui\b/i] },
  { label: "Electron", aliases: [/electron\b/i] },
  { label: "Tauri", aliases: [/tauri\b/i] },

  /* Backend / APIs */
  { label: "Express", aliases: [/express(\.js)?\b/i] },
  { label: "Nest.js", aliases: [/nest(\.js)?\b/i, /\bnestjs\b/i] },
  { label: "Fastify", aliases: [/fastify\b/i] },
  { label: "Spring Boot", aliases: [/spring\s*boot\b/i] },
  { label: "Django", aliases: [/django\b/i] },
  { label: "Flask", aliases: [/flask\b/i] },
  { label: "Laravel", aliases: [/laravel\b/i] },
  { label: "Ruby on Rails", aliases: [/ruby on rails\b/i, /\brails\b/i] },
  { label: "gRPC", aliases: [/\bgrpc\b/i] },
  { label: "REST API", aliases: [/\brest(ful)?\b.*api/i, /\bhttp api\b/i, /\bjson api\b/i] },
  { label: "GraphQL", aliases: [/graphql\b/i, /\bapollo\b.*graphql/i, /\bgraphql\b.*apollo/i] },
  { label: "tRPC", aliases: [/\btrpc\b/i] },
  { label: "SOAP", aliases: [/\bsoap\b/i] },

  /* SSR / SSG / Fullstack Frameworks */
  { label: "Remix", aliases: [/remix\b/i] },
  { label: "Gatsby", aliases: [/gatsby\b/i] },
  { label: "Astro", aliases: [/astro\b/i] },
  { label: "Blitz.js", aliases: [/blitz(\.js)?\b/i] },
  { label: "SvelteKit", aliases: [/sveltekit\b/i] },

  /* Databases / Cache / Search */
  { label: "PostgreSQL", aliases: [/postgres(ql)?\b/i] },
  { label: "MySQL", aliases: [/mysql\b/i] },
  { label: "MariaDB", aliases: [/mariadb\b/i] },
  { label: "SQLite", aliases: [/sqlite\b/i] },
  { label: "MongoDB", aliases: [/mongodb\b/i, /\bmongo(db)?\b/i] },
  { label: "Redis", aliases: [/redis\b/i] },
  { label: "Elasticsearch", aliases: [/elastic\s*search\b/i, /\belasticsearch\b/i] },
  { label: "OpenSearch", aliases: [/opensearch\b/i] },
  { label: "DynamoDB", aliases: [/dynamodb\b/i] },
  { label: "Cassandra", aliases: [/cassandra\b/i] },
  { label: "Neo4j", aliases: [/neo4j\b/i] },

  /* ORM / Query */
  { label: "Prisma", aliases: [/prisma\b/i] },
  { label: "TypeORM", aliases: [/typeorm\b/i] },
  { label: "Sequelize", aliases: [/sequelize\b/i] },
  { label: "Mongoose", aliases: [/mongoose\b/i] },
  { label: "JOOQ", aliases: [/\bjooq\b/i] },
  { label: "Hibernate", aliases: [/hibernate\b/i] },

  /* Build / Bundling / Quality */
  { label: "Webpack", aliases: [/webpack\b/i] },
  { label: "Vite", aliases: [/\bvite\b/i] },
  { label: "Rollup", aliases: [/rollup\b/i] },
  { label: "Babel", aliases: [/babel\b/i] },
  { label: "ESLint", aliases: [/eslint\b/i] },
  { label: "Prettier", aliases: [/prettier\b/i] },
  { label: "Commitlint", aliases: [/commitlint\b/i] },
  { label: "Husky", aliases: [/husky\b/i] },
  { label: "Monorepo", aliases: [/monorepo\b/i, /\bnx\b/i, /\bturborepo\b/i, /\bturbo repo\b/i] },

  /* Cloud / Infra / DevOps */
  { label: "AWS", aliases: [/\baws\b/i, /amazon web services/i, /\baurora\b/i, /\blambda\b/i, /\bs3\b/i, /\bec2\b/i, /\brds\b/i, /\bcloudfront\b/i, /\bapi gateway\b/i] },
  { label: "GCP", aliases: [/\bgcp\b/i, /google cloud/i, /\bcloud run\b/i, /\bgke\b/i, /\bcloud functions\b/i, /\bbigquery\b/i] },
  { label: "Azure", aliases: [/azure\b/i, /\bazure functions\b/i, /\baks\b/i] },
  { label: "Docker", aliases: [/docker\b/i] },
  { label: "Kubernetes", aliases: [/\bk8s\b/i, /kubernetes\b/i, /\bhelm\b/i] },
  { label: "Terraform", aliases: [/terraform\b/i] },
  { label: "Pulumi", aliases: [/pulumi\b/i] },
  { label: "Serverless Framework", aliases: [/serverless framework\b/i, /\bserverless\.yml\b/i] },
  { label: "Ansible", aliases: [/ansible\b/i] },
  { label: "Nginx", aliases: [/nginx\b/i] },
  { label: "Linux", aliases: [/linux\b/i, /\bunix\b/i] },

  /* CI/CD / Platforms */
  { label: "CI/CD", aliases: [/\bci\/cd\b/i, /\bpipeline(s)?\b/i, /\bbuild pipeline\b/i] },
  { label: "GitHub Actions", aliases: [/github actions?\b/i] },
  { label: "GitLab CI", aliases: [/gitlab\s*ci\b/i] },
  { label: "Jenkins", aliases: [/jenkins\b/i] },
  { label: "CircleCI", aliases: [/circle\s*ci\b/i] },
  { label: "Travis CI", aliases: [/travis\s*ci\b/i] },

  /* Observability */
  { label: "Prometheus", aliases: [/prometheus\b/i] },
  { label: "Grafana", aliases: [/grafana\b/i] },
  { label: "ELK Stack", aliases: [/\belk\b/i, /elastic(search)?\s*logstash\s*kibana/i] },
  { label: "OpenTelemetry", aliases: [/open\s*telemetry\b/i, /\botel\b/i] },
  { label: "Sentry", aliases: [/sentry\b/i] },
  { label: "Datadog", aliases: [/datadog\b/i] },
  { label: "New Relic", aliases: [/new\s*relic\b/i] },

  /* Testing / Quality / Security */
  { label: "Jest", aliases: [/jest\b/i] },
  { label: "Vitest", aliases: [/vitest\b/i] },
  { label: "Mocha", aliases: [/mocha\b/i] },
  { label: "Chai", aliases: [/chai\b/i] },
  { label: "Cypress", aliases: [/cypress\b/i] },
  { label: "Playwright", aliases: [/playwright\b/i] },
  { label: "Puppeteer", aliases: [/puppeteer\b/i] },
  { label: "TDD", aliases: [/\btdd\b/i, /test[-\s]?driven\b/i] },
  { label: "BDD", aliases: [/\bbdd\b/i, /behavior[-\s]?driven\b/i] },
  { label: "Security", aliases: [/\bowasp\b/i, /\bxss\b/i, /\bsql injection\b/i, /\bcsrf\b/i, /\bsast\b/i, /\bdast\b/i] },

  /* Data / Streaming / Analytics */
  { label: "Kafka", aliases: [/kafka\b/i] },
  { label: "RabbitMQ", aliases: [/rabbitmq\b/i] },
  { label: "Spark", aliases: [/apache\s*spark\b/i, /\bspark\b/i] },
  { label: "Airflow", aliases: [/airflow\b/i] },
  { label: "Pandas", aliases: [/pandas\b/i] },
  { label: "NumPy", aliases: [/numpy\b/i] },
  { label: "Snowflake", aliases: [/snowflake\b/i] },
  { label: "dbt", aliases: [/\bdbt\b/i, /data build tool/i] },

  /* Auth / Identity / Payment */
  { label: "OAuth 2.0", aliases: [/oauth\s*2(\.0)?\b/i, /\boidc\b/i, /openid connect/i] },
  { label: "JWT", aliases: [/\bjwt\b/i, /json web token/i] },
  { label: "Keycloak", aliases: [/keycloak\b/i] },
  { label: "Auth0", aliases: [/auth0\b/i] },
  { label: "Stripe", aliases: [/stripe\b/i] },
  { label: "Braintree", aliases: [/braintree\b/i] },

  /* Architecture / Methods / Practices */
  { label: "Microservices", aliases: [/micro[-\s]?services?\b/i] },
  { label: "Event-Driven", aliases: [/event[-\s]?driven\b/i, /\beda\b/i] },
  { label: "CQRS", aliases: [/\bcqrs\b/i] },
  { label: "DDD", aliases: [/\bddd\b/i, /domain[-\s]?driven\b/i] },
  { label: "Clean Architecture", aliases: [/clean\s*architecture\b/i] },
  { label: "Clean Code", aliases: [/clean\s*code\b/i] },
  { label: "SOLID", aliases: [/\bsolid\b/i] },
  { label: "Scrum", aliases: [/scrum\b/i] },
  { label: "Kanban", aliases: [/kanban\b/i] },
  { label: "Agile", aliases: [/agile\b/i] },

  /* Platforms / Tools */
  { label: "Git", aliases: [/\bgit\b/i] },
  { label: "GitHub", aliases: [/github\b/i] },
  { label: "GitLab", aliases: [/gitlab\b/i] },
  { label: "Bitbucket", aliases: [/bitbucket\b/i] },
  { label: "Jira", aliases: [/jira\b/i] },
  { label: "Confluence", aliases: [/confluence\b/i] },
  { label: "Notion", aliases: [/notion\b/i] },
  { label: "Figma", aliases: [/figma\b/i] },
  { label: "Postman", aliases: [/postman\b/i] },
  { label: "cURL", aliases: [/\bcurl\b/i] },
  { label: "VS Code", aliases: [/vs\s*code\b/i, /\bvisual studio code\b/i] },

  /* Other Web capabilities */
  { label: "WebSockets", aliases: [/web\s*sockets?\b/i, /\bsocket\.io\b/i] },
  { label: "WebRTC", aliases: [/webrtc\b/i] },
  { label: "Service Workers", aliases: [/service\s*workers?\b/i, /\bpwa\b/i, /progressive web app/i] },
  { label: "Internationalization", aliases: [/i18n\b/i, /internationali[sz]ation/i, /locali[sz]ation|\bl10n\b/i] },
  { label: "Accessibility", aliases: [/\ba11y\b/i, /accessibility\b/i, /wcag\b/i] },
  { label: "SEO", aliases: [/\bseo\b/i, /search engine optimization/i] },

  /* Language/Location/Mode (optional) */
  { label: "German C1", aliases: [/deutsch.*(c1|muttersprach)/i, /\bgerman\b.*c1\b/i] },
  { label: "German B2", aliases: [/deutsch.*b2/i, /\bgerman\b.*b2\b/i] },
  { label: "English C1", aliases: [/\benglish\b.*c1\b/i, /\bc1\b.*english\b/i] },
  { label: "Remote", aliases: [/\bremote\b/i, /100%\s*remote/i, /voll(remote|ständig)\b/i, /\bhome\s*office\b/i] },
  { label: "Hybrid", aliases: [/\bhybrid\b/i] },
];
