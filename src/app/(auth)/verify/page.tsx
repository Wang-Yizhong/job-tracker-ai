// --- file: src/app/verify/page.tsx
import type { Metadata } from "next";
import CountdownRedirect from "./CountdownRedirect";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verify Email" };

type ApiOkShape = { ok: true } | { verified: true; email?: string };
type ApiErrShape = {
  ok?: false;
  code?: "TOKEN_EXPIRED" | "TOKEN_NOT_FOUND" | "INVALID_TOKEN";
  error?: string;
};

type State =
  | { t: "success"; email?: string; countdown: number }
  | { t: "error"; msg: string };

async function verifyToken(token: string): Promise<{ ok: boolean; email?: string; msg?: string }> {
  if (!token) return { ok: false, msg: "Ungültiger Link: Token fehlt." };

  try {
    const resp = await fetch("/api/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });

    const data = (await resp.json()) as ApiOkShape | ApiErrShape;

    const isOk =
      (typeof (data as any)?.ok === "boolean" && (data as any).ok === true) ||
      (data as any)?.verified === true;

    if (isOk) {
      const email = (data as any)?.email as string | undefined;
      return { ok: true, email };
    }

    const code = (data as ApiErrShape)?.code;
    const msg =
      code === "TOKEN_EXPIRED"
        ? "Der Verifizierungslink ist abgelaufen. Bitte fordere eine neue E-Mail an."
        : code === "TOKEN_NOT_FOUND" || code === "INVALID_TOKEN"
        ? "Ungültiger oder bereits verwendeter Link."
        : (data as ApiErrShape)?.error || "Verifizierung fehlgeschlagen.";
    return { ok: false, msg };
  } catch (e: any) {
    return { ok: false, msg: e?.message || "Verifizierung fehlgeschlagen." };
  }
}

type SP = { token?: string; email?: string };

export default async function VerifyPage({
  searchParams,
}: {
  // ✅ 符合 Next 的约束：Promise<any> | undefined
  searchParams?: Promise<SP>;
}) {
  const sp = (await (searchParams ?? Promise.resolve({} as SP))) as SP;
  const token = sp.token ?? "";
  const emailFromUrl = sp.email ?? undefined;

  const result = await verifyToken(token);

  const state: State = result.ok
    ? { t: "success", email: result.email ?? emailFromUrl, countdown: 5 }
    : { t: "error", msg: result.msg || "Verifizierung fehlgeschlagen." };

  return (
    <div className="min-h-[100dvh] grid place-items-center bg-white p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        {state.t === "error" ? (
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
        ) : (
          <>
            <h1 className="text-xl font-semibold text-emerald-700">
              Verifizierung erfolgreich 🎉
            </h1>
            {state.email ? (
              <p className="mt-2 text-sm text-slate-600">
                Deine E-Mail <span className="font-medium">{state.email}</span> wurde bestätigt.
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Deine E-Mail wurde bestätigt.</p>
            )}

            <CountdownRedirect
              seconds={state.countdown}
              href="/auth?mode=login&verified=1"
              prefillEmail={state.email}
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
        )}
      </div>
    </div>
  );
}
