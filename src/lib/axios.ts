// --- file: src/lib/axios.ts
"use client";

import axios, {
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "@/hooks/use-toast";

let isRedirectingFor401 = false; // 防止多次 toast/跳转

// --- 基础实例 ---
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 15000,
});

// Fehlercode → Nachricht (Deutsch)
const codeMessage: Record<string, string> = {
  UNAUTHORIZED: "Bitte melde dich erneut an.",
  EMAIL_NOT_VERIFIED: "Bitte bestätige zuerst deine E-Mail-Adresse.",
  FORBIDDEN: "Keine Berechtigung.",
  NOT_FOUND: "Nicht gefunden.",
  CONFLICT: "Konflikt.",
  UNPROCESSABLE: "Ungültige Eingabe.",
  RATE_LIMITED: "Zu viele Anfragen. Bitte versuche es später erneut.",
  SERVER_ERROR: "Serverfehler. Bitte versuche es später erneut.",
  HTTP_ERROR: "Unbekannter Fehler.",
};

// 请求拦截器（如需统一 header，可以在这里加）
api.interceptors.request.use((config: InternalAxiosRequestConfig) => config);

// --- 成功响应：统一“瘦身” → 直接返回 payload ---
// 支持两种后端风格：
// 1) REST 直接返回数据        → resp.data
// 2) 包一层 { ok:true, data } → resp.data.data
api.interceptors.response.use(
  (resp: AxiosResponse<any>) => {
    const data = resp.data;
    if (data && data.ok === true && "data" in data) {
      return data.data; // <T>
    }
    return data; // <T>
  },
  (error: AxiosError | any) => {
    // A) 静默处理：请求被取消
    const isCanceled =
      axios.isCancel?.(error) ||
      error?.code === "ERR_CANCELED" ||
      error?.name === "CanceledError" ||
      error?.name === "AbortError" ||
      error?.message === "canceled";

    if (isCanceled) {
      return Promise.reject(error);
    }

    // B) 超时单独提示
    if (error?.code === "ECONNABORTED") {
      toast({
        title: "Zeitüberschreitung",
        description: "Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.",
        duration: 5000,
      });
      return Promise.reject(error);
    }

    const status = error?.response?.status as number | undefined;
    const payload = error?.response?.data ?? {};
    const code: string | undefined = payload?.code;

    const message: string =
      payload?.message ??
      (status ? codeMessage[statusToCode(status)] : codeMessage.HTTP_ERROR);

    // C) 401：提示 + 倒计时跳转登录
    if (status === 401) {
      if (typeof window !== "undefined" && !isRedirectingFor401) {
        isRedirectingFor401 = true;

        let seconds = 3;
        const next = encodeURIComponent(
          window.location.pathname + window.location.search
        );

        const t = toast({
          title: "Nicht angemeldet",
          description: `Weiterleitung zur Anmeldung in ${seconds} Sekunden…`,
          variant: "destructive",
          duration: 4000,
        });

        const interval = setInterval(() => {
          seconds -= 1;
          if (seconds > 0) {
            t.update?.({
              id: t.id,
              title: "Nicht angemeldet",
              description: `Weiterleitung zur Anmeldung in ${seconds} Sekunden…`,
              variant: "destructive",
            });
          } else {
            clearInterval(interval);
            t.dismiss?.();
            window.location.assign(`/auth?next=${next}`);
          }
        }, 1000);
      }

      // 阻断后续链（保持与原逻辑一致）
      return new Promise(() => {});
    }

    // D) 429 限流
    if (status === 429) {
      toast({
        title: "Zu viele Anfragen",
        description: codeMessage.RATE_LIMITED,
        duration: 4000,
      });
      return Promise.reject(payload || error);
    }

    // E) 其他错误统一提示
    toast({
      title: `Anfrage fehlgeschlagen${status ? ` (${status})` : ""}`,
      description: code && codeMessage[code] ? codeMessage[code] : message,
      variant: status && status >= 500 ? "destructive" : undefined,
      duration: 5000,
    });

    return Promise.reject(payload || error);
  }
);

function statusToCode(s: number) {
  if (s === 401) return "UNAUTHORIZED";
  if (s === 403) return "FORBIDDEN";
  if (s === 404) return "NOT_FOUND";
  if (s === 409) return "CONFLICT";
  if (s === 422) return "UNPROCESSABLE";
  if (s === 429) return "RATE_LIMITED";
  return s >= 500 ? "SERVER_ERROR" : "HTTP_ERROR";
}

/**
 * ✅ 关键：类型友好的轻量包装
 * 利用 Axios v1 的重载：get<T, R=AxiosResponse<T>> → 传 <T, T> 让返回 Promise<T>
 * 这样你就可以直接写 const { id } = await http.post<{id:string}>(...)
 */
export const http = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return api.get<T, T>(url, config) as unknown as Promise<T>;
  },
  post<T = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T> {
    return api.post<T, T, D>(url, data, config) as unknown as Promise<T>;
  },
  put<T = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T> {
    return api.put<T, T, D>(url, data, config) as unknown as Promise<T>;
  },
  patch<T = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T> {
    return api.patch<T, T, D>(url, data, config) as unknown as Promise<T>;
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return api.delete<T, T>(url, config) as unknown as Promise<T>;
  },
};
// 如需保留原始 axios 实例（偶尔要拿到 headers / status），也导出一下：
export default api;
