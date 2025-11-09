import { useMutation } from "@tanstack/react-query";
import { register as registerApi } from "../api/authApi";

export function useRegister(opts?: {
  onEmailSent?: (email: string) => void;
  onAlreadyVerified?: (email: string, password: string) => void;
  onError?: (msg: string) => void;
}) {
  const m = useMutation({
    mutationFn: registerApi,
    onSuccess: (data, vars) => {
      if (data?.alreadyVerified) opts?.onAlreadyVerified?.(vars.email, vars.password);
      else opts?.onEmailSent?.(vars.email);
    },
    onError: (err: any) => opts?.onError?.(err?.response?.data?.error ?? err?.message),
  });

  return {
    register: m.mutateAsync,
    registering: m.isPending,
  };
}
