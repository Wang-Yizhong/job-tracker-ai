import { useMutation } from "@tanstack/react-query";
import { resendVerify } from "../api/authApi";

export function useResendVerify(opts?: { onResent?: () => void; onError?: (msg: string) => void }) {
  const m = useMutation({
    mutationFn: resendVerify,
    onSuccess: () => opts?.onResent?.(),
    onError: (err: any) => opts?.onError?.(err?.response?.data?.error ?? err?.message),
  });

  return {
    resend: m.mutateAsync,
    isResending: m.isPending,
  };
}
