// --- file: src/features/auth/hooks/useVerifyEmail.ts
"use client";

import { useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  verifyEmail as apiVerifyEmail,
  type VerifyEmailDto,
  type VerifyEmailResp,
} from "@/features/auth/api/authApi";

type ApiOkShape = { ok: true } | { verified: true; email?: string };
type ApiErrShape = {
  ok?: false;
  code?: "TOKEN_EXPIRED" | "TOKEN_NOT_FOUND" | "INVALID_TOKEN";
  error?: string;
};

export type VerifyState =
  | { t: "idle" }
  | { t: "loading" }
  | { t: "success"; email?: string }
  | { t: "error"; msg: string };

function mapError(data: ApiErrShape | unknown): string {
  const code = (data as ApiErrShape)?.code;
  if (code === "TOKEN_EXPIRED") {
    return "Der Verifizierungslink ist abgelaufen. Bitte fordere eine neue E-Mail an.";
  }
  if (code === "TOKEN_NOT_FOUND" || code === "INVALID_TOKEN") {
    return "Ungültiger oder bereits verwendeter Link.";
  }
  const raw = (data as ApiErrShape)?.error;
  return raw || "Verifizierung fehlgeschlagen.";
}

export function useVerifyEmail(token?: string) {
  const m = useMutation<VerifyEmailResp, Error, VerifyEmailDto>({
    mutationFn: async (dto: VerifyEmailDto) => {
      if (!dto?.token) throw new Error("Ungültiger Link: Token fehlt.");
      const resp = await apiVerifyEmail(dto); // 约定：POST { token }
      return resp;
    },
  });

  // 首次挂载即发起验证（有 token 时）
  useEffect(() => {
    if (!token) return;
    if (m.status === "idle") {
      m.mutate({ token });
    }
  }, [token, m.status, m.mutate]);

  const state: VerifyState = useMemo(() => {
    if (m.status === "pending") return { t: "loading" };

    if (m.status === "success") {
      const d = m.data as ApiOkShape | ApiErrShape;
      const ok =
        (typeof (d as any)?.ok === "boolean" && (d as any).ok === true) ||
        (d as any)?.verified === true;
      return ok
        ? { t: "success", email: (d as any)?.email }
        : { t: "error", msg: mapError(d) };
    }

    if (m.status === "error") {
      return { t: "error", msg: mapError(m.error) };
    }

    return { t: "idle" };
  }, [m.status, m.data, m.error]);

  return {
    state,
    verifying: m.status === "pending",
    refetch: () => token && m.mutate({ token }),
  };
}
