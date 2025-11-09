// --- file: src/lib/api/http.ts
"use client";

import axios, {
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from "axios";
import { toast } from "@/hooks/use-toast";
import { resolveApiBaseUrl } from "./config";

const api = axios.create({
  baseURL: resolveApiBaseUrl(), // e.g. "/api"
  withCredentials: true,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

let isRedirecting401 = false;
let csrfInFlight: Promise<void> | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&") + "=([^;]+)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrf(): Promise<void> {
  if (typeof window === "undefined") return;
  const existing = readCookie("csrf");
  if (existing) return;
  if (csrfInFlight) return csrfInFlight;

  csrfInFlight = fetch("/api/v1/security/csrf", { credentials: "include" })
    .then(() => {})
    .catch(() => {})
    .finally(() => (csrfInFlight = null));

  return csrfInFlight;
}

function genRequestId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = (config.method || "get").toUpperCase();
  if (!config.headers) config.headers = new AxiosHeaders();

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    await ensureCsrf();
    const csrf = readCookie("csrf");
    if (csrf) (config.headers as any)["X-CSRF-Token"] = csrf;
    (config.headers as any)["X-Request-Id"] = genRequestId();
    (config.headers as any)["X-Request-Timestamp"] = String(Math.floor(Date.now() / 1000));

    const isForm =
      typeof FormData !== "undefined" && config.data instanceof FormData;
    const isBlob = typeof Blob !== "undefined" && config.data instanceof Blob;
    if (!isForm && !isBlob)
      (config.headers as any)["Content-Type"] =
        (config.headers as any)["Content-Type"] || "application/json";
  }

  return config;
});

api.interceptors.response.use(
  (resp: AxiosResponse<any>) => {
    const data = resp.data;
    if (data && data.ok === true && "data" in data) return data.data;
    return data;
  },
  (error: AxiosError | any) => {
    const canceled =
      axios.isCancel(error) ||
      error?.code === "ERR_CANCELED" ||
      error?.name === "AbortError";
    if (canceled) return Promise.reject(error);

    const status = error?.response?.status;
    if (status === 401 && typeof window !== "undefined" && !isRedirecting401) {
      isRedirecting401 = true;
      let seconds = 3;
      const next = encodeURIComponent(location.pathname + location.search);
      const t = toast({
        title: "Nicht angemeldet",
        description: `Weiterleitung zur Anmeldung in ${seconds} Sekunden…`,
        variant: "destructive",
      });
      const timer = setInterval(() => {
        seconds -= 1;
        if (seconds > 0) {
          t.update?.({
            id: t.id,
            description: `Weiterleitung in ${seconds} Sekunden…`,
          });
        } else {
          clearInterval(timer);
          t.dismiss?.();
          location.assign(`/auth?next=${next}`);
        }
      }, 1000);
      return new Promise(() => {});
    }

    toast({
      title: `Fehler ${status ?? ""}`,
      description: (error?.response?.data as any)?.message || "Anfrage fehlgeschlagen.",
      variant: status && status >= 500 ? "destructive" : undefined,
    });
    return Promise.reject(error);
  }
);

export const http = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return api.get<T, T>(url, config);
  },
  post<T = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return api.post<T, T, D>(url, data, config);
  },
  put<T = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return api.put<T, T, D>(url, data, config);
  },
  patch<T = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return api.patch<T, T, D>(url, data, config);
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return api.delete<T, T>(url, config);
  },
};

export default api;
