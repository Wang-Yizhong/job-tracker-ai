import { useMutation } from "@tanstack/react-query";
import { login as loginApi } from "../api/authApi";

export function useLogin(opts?: { onSuccess?: () => void; onError?: (msg: string) => void }) {
  const m = useMutation({
    mutationFn: loginApi,
    onSuccess: () => opts?.onSuccess?.(),
    onError: (err: any) => opts?.onError?.(err?.response?.data?.error ?? err?.message),
  });

  return {
    login: m.mutateAsync,
    loggingIn: m.isPending,
  };
}
