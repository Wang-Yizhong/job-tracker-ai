// --- file: src/app/(auth)/verify/page.tsx
"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import CountdownRedirect from "@/features/auth/components/CountdownRedirect";
import { useVerifyEmail } from "@/features/auth/hooks/useVerifyEmail";

export const dynamic = "force-dynamic";

export default function VerifyPage() {
  return (
    <div className="min-h-[100dvh] grid place-items-center bg-white p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <Suspense
          fallback={
            <>
              <h1 className="text-xl font-semibold text-slate-700">Wird verifiziert …</h1>
              <p className="mt-2 text-sm text-slate-600">Bitte einen Moment Geduld.</p>
            </>
          }
        >
          <VerifyClient />
        </Suspense>
      </div>
    </div>
  );
}

// 🔹 真正使用 useSearchParams 的逻辑移到子组件里
function VerifyClient() {
  const sp = useSearchParams();
  const token = sp.get("token") ?? undefined;
  const emailFromUrl = sp.get("email") ?? undefined;

  const { state, verifying } = useVerifyEmail(token);

  const view = useMemo(() => {
    if (verifying || state.t === "idle" || state.t === "loading") {
      return (
        <>
          <h1 className="text-xl font-semibold text-slate-700">Wird verifiziert …</h1>
          <p className="mt-2 text-sm text-slate-600">Bitte einen Moment Geduld.</p>
        </>
      );
    }

    if (state.t === "error") {
      return (
        <>
          <h1 className="text-xl font-semibold text-red-700">Verifizierung fehlgeschlagen</h1>
          <p className="mt-2 text-sm text-slate-600">{state.msg}</p>
          <div className="mt-4 flex gap-2">
            <a
              href="/auth?mode=login"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Zum Login
            </a>
            <a
              href="/auth?mode=register"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Erneut registrieren
            </a>
          </div>
        </>
      );
    }

    // success
    const email = state.email ?? emailFromUrl;
    return (
      <>
        <h1 className="text-xl font-semibold text-emerald-700">
          Verifizierung erfolgreich 🎉
        </h1>
        {email ? (
          <p className="mt-2 text-sm text-slate-600">
            Deine E-Mail <span className="font-medium">{email}</span> wurde bestätigt.
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Deine E-Mail wurde bestätigt.</p>
        )}

        <CountdownRedirect
          seconds={5}
          href="/auth?mode=login&verified=1"
          prefillEmail={email}
        />

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
  }, [state, verifying, emailFromUrl]);

  return <>{view}</>;
}
