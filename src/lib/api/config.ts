// --- file: src/lib/api/config.ts
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
}

export const API_VERSION = "/v1";

let runtimeBaseUrl: string | null = null;

export function setApiBaseUrl(url: string): void {
  runtimeBaseUrl = url;
}

export function resolveApiBaseUrl(): string {
  return runtimeBaseUrl || getApiBaseUrl();
}

/** e.g. joinApiPath('/jobs', true) -> '/v1/jobs' */
export function joinApiPath(path: string, withVersion = true): string {
  const prefix = withVersion ? API_VERSION : "";
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}
