// --- file: src/app/verify/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

type ApiOkShape = { ok: true } | { verified: true; email?: string };
type ApiErrShape = {
  ok?: false;
  code?: "TOKEN_EXPIRED" | "TOKEN_NOT_FOUND" | "INVALID_TOKEN";
  error?: string;
};

type State =
  | { t: "loading" }
  | { t: "success"; email?: string; countdown: number }
  | { t: "error"; msg: string };

export default function VerifyPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const emailFromUrl = sp.get("email") || undefined; // 链接里若带了 email 就用来预填

  const once = useRef(false);
  const [state, setState] = useState<State>({ t: "loading" });

  // 倒计时与跳转
  useEffect(() => {
    if (state.t !== "success") return;
    if (state.countdown <= 0) {
      router.replace("/auth?mode=login&verified=1");
      return;
    }
    const id = setTimeout(() => {
      setState((s) => (s.t === "success" ? { ...s, countdown: s.countdown - 1 } : s));
    }, 1000);
    return () => clearTimeout(id);
  }, [state, router]);

  // 只请求一次，兼容后端两种返回结构
  useEffect(() => {
    if (once.current) return;
    once.current = true;

    (async () => {
      if (!token) {
        setState({ t: "error", msg: "Ungültiger Link: Token fehlt." });
        return;
      }

      try {
        // NOTE: 这里不要再解构 { data } 了，api 已经返回的就是 data 本身
        const result = await api.post<ApiOkShape>("/verify-email", { token });
        // 兼容 { ok:true } 或 { verified:true, email? }
        const ok =
          (typeof (result as any)?.ok === "boolean" && (result as any).ok === true) ||
          (result as any)?.verified === true;

        if (!ok) {
          setState({ t: "error", msg: "Verifizierung fehlgeschlagen." });
          return;
        }

        // 预填邮箱：优先接口返回，其次 URL 上的 email
        const email = (result as any)?.email ?? emailFromUrl;
        if (email) {
          try {
            localStorage.setItem("auth_prefill_email", String(email));
          } catch {}
        }

        setState({ t: "success", email, countdown: 5 });
      } catch (err: any) {
        // 如果你的 axios 拦截器把错误也“解包”了，就没有 response；两种都兜一下
        const payload: ApiErrShape | undefined = err?.response?.data ?? err;
        const code = payload?.code as ApiErrShape["code"] | undefined;

        const msg =
          code === "TOKEN_EXPIRED"
            ? "Der Verifizierungslink ist abgelaufen. Bitte fordere eine neue E-Mail an."
            : code === "TOKEN_NOT_FOUND" || code === "INVALID_TOKEN"
            ? "Ungültiger oder bereits verwendeter Link."
            : payload?.error || err?.message || "Verifizierung fehlgeschlagen.";

        setState({ t: "error", msg });
      }
    })();
  }, [token, emailFromUrl]);

  const content = useMemo(() => {
    if (state.t === "loading") {
      return (
        <>
          <h1 className="text-xl font-semibold text-slate-900">E-Mail wird verifiziert …</h1>
          <p className="mt-2 text-sm text-slate-600">Bitte einen Moment gedulden.</p>
        </>
      );
    }
    if (state.t === "error") {
      return (
        <>
          <h1 className="text-xl font-semibold text-red-700">Verifizierung fehlgeschlagen</h1>
          <p className="mt-2 text-sm text-slate-600">{state.msg}</p>
          <div className="mt-4 flex gap-2">
            <a href="/auth?mode=login" className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
              Zum Login
            </a>
            <a href="/auth?mode=register" className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
              Erneut registrieren
            </a>
          </div>
        </>
      );
    }
    // success
    return (
      <>
        <h1 className="text-xl font-semibold text-emerald-700">Verifizierung erfolgreich 🎉</h1>
        {state.email ? (
          <p className="mt-2 text-sm text-slate-600">
            Deine E-Mail <span className="font-medium">{state.email}</span> wurde bestätigt.
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Deine E-Mail wurde bestätigt.</p>
        )}
        <p className="mt-4 text-sm text-slate-600">Du wirst in {state.countdown}s zur Anmeldung weitergeleitet …</p>
        <div className="mt-4">
          <a
            href="/auth?mode=login&verified=1"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Jetzt zum Login
          </a>
        </div>
      </>
    );
  }, [state]);

  return (
    <div className="min-h-[100dvh] grid place-items-center bg-white p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        {content}
      </div>
    </div>
  );
}
