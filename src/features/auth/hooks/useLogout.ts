// --- file: src/features/auth/hooks/useLogout.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { logout } from "../api/authApi";

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();

  const mu = useMutation({
    mutationFn: () => logout(),
    onSuccess: async () => {
      router.replace("/auth");

    },
  });

  return {
    logout: mu.mutateAsync,
    loggingOut: mu.isPending,
  };
}
