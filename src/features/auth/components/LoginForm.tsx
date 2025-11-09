"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/features/auth/schemas/login.schema";
import { useLogin } from "@/features/auth/hooks/useLogin";

type Props = {
  onSuccessGoDashboard?: boolean;
  onSuccess?: () => void;
  onSwitchToRegister: () => void;
};

export default function LoginForm({
  onSuccessGoDashboard = false,
  onSuccess,
  onSwitchToRegister,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const { login, loggingIn } = useLogin({
    onSuccess: () => {
      if (onSuccessGoDashboard) window.location.assign("/dashboard");
      else onSuccess?.();
    },
  });

  React.useEffect(() => {
    try {
      const email = localStorage.getItem("auth_prefill_email") ?? "";
      const pwd = localStorage.getItem("auth_prefill_pwd") ?? "";
      if (email) {
        setValue("email", email);
        localStorage.removeItem("auth_prefill_email");
      }
      if (pwd) {
        setValue("password", pwd);
        localStorage.removeItem("auth_prefill_pwd");
      }
    } catch {}
  }, [setValue]);

  const loading = isSubmitting || loggingIn;
  async function onSubmit(values: LoginValues) { await login(values); }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <label className="block text-sm text-slate-600">E-Mail</label>
        <input
          {...register("email")}
          type="email"
          placeholder="du@beispiel.de"
          autoComplete="email"
          className={`
            w-full h-11 rounded-xl border bg-white/90 px-3 text-sm shadow-inner outline-none
            focus:ring-2 focus:ring-[rgba(79,70,229,0.6)] focus:border-[rgba(79,70,229,0.6)]
            transition-all
            ${errors.email ? "border-red-400" : "border-slate-200"}
          `}
        />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm text-slate-600">Passwort</label>
        <input
          {...register("password")}
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          className={`
            w-full h-11 rounded-xl border bg-white/90 px-3 text-sm shadow-inner outline-none
            focus:ring-2 focus:ring-[rgba(79,70,229,0.6)] focus:border-[rgba(79,70,229,0.6)]
            transition-all
            ${errors.password ? "border-red-400" : "border-slate-200"}
          `}
        />
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("rememberMe")} className="h-4 w-4" />
          Eingeloggt bleiben
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`
          w-full h-11 rounded-2xl px-4 text-sm font-medium text-white
          bg-gradient-to-r from-[#4F46E5] to-[#6366F1]
          shadow-sm hover:shadow-md active:scale-[0.98]
          focus:outline-none focus:ring-2 focus:ring-[rgba(79,70,229,0.6)]
          ${loading ? "opacity-70 cursor-wait" : ""}
        `}
      >
        {loading ? "Bitte warten …" : "Anmelden"}
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white/90 px-2 text-xs text-slate-500">oder</span>
        </div>
      </div>

      <p className="text-center text-sm text-slate-600">
        Neu hier?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-[#4F46E5] hover:underline underline-offset-4"
        >
          Konto erstellen
        </button>
      </p>
    </form>
  );
}
