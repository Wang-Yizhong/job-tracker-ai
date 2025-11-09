"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterValues } from "@/features/auth/schemas/register.schema";
import { useRegister } from "@/features/auth/hooks/useRegister";
import { useResendVerify } from "@/features/auth/hooks/useResendVerify";

type Props = {
  onEmailSent: (email: string) => void;
  onAlreadyVerified: (email: string, password: string) => void;
  onSwitchToLogin?: () => void;
  cooldown: number;
  setCooldown: (n: number) => void;
};

export default function RegisterForm({
  onEmailSent,
  onAlreadyVerified,
  onSwitchToLogin,
  cooldown,
  setCooldown,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const password = watch("password");

  const { register: doRegister, registering } = useRegister({
    onEmailSent: (email) => { onEmailSent(email); setCooldown(60); },
    onAlreadyVerified: (email) => { onAlreadyVerified(email, password || ""); },
  });

  const { resend, isResending } = useResendVerify({ onResent: () => setCooldown(60) });

  const loading = isSubmitting || registering;
  async function onSubmit(values: RegisterValues) {
    await doRegister({ email: values.email, password: values.password });
  }

  return (
    <div className="space-y-5">
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
            placeholder="Mindestens 8 Zeichen"
            autoComplete="new-password"
            className={`
              w-full h-11 rounded-xl border bg-white/90 px-3 text-sm shadow-inner outline-none
              focus:ring-2 focus:ring-[rgba(79,70,229,0.6)] focus:border-[rgba(79,70,229,0.6)]
              transition-all
              ${errors.password ? "border-red-400" : "border-slate-200"}
            `}
          />
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("acceptTos")} className="mt-1 h-4 w-4" />
          <span>
            Ich stimme den{" "}
            <a className="text-[#4F46E5] hover:underline underline-offset-4" href="#">
              AGB
            </a>{" "}
            und der{" "}
            <a className="text-[#4F46E5] hover:underline underline-offset-4" href="#">
              Datenschutzerklärung
            </a>{" "}
            zu.
          </span>
        </label>
        {errors.acceptTos && (
          <p className="text-xs text-red-600">{String(errors.acceptTos.message)}</p>
        )}

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
          {loading ? "Bitte warten …" : "Konto erstellen"}
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
          Bereits registriert?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-[#4F46E5] hover:underline underline-offset-4"
          >
            Zum Login
          </button>
        </p>

        <p className="mt-2 text-center text-xs text-emerald-700">
          Nach erfolgreicher Registrierung senden wir dir eine Verifizierungs-E-Mail.
        </p>
      </form>

      {/* 重发占位（逻辑不改） */}
      <button
        disabled={cooldown > 0 || isResending}
        onClick={() => { /* resend(...) 由页面准备好邮箱后接入 */ }}
        className={`
          w-full h-10 rounded-xl border px-3 text-sm font-medium transition
          ${cooldown > 0 || isResending
            ? "cursor-not-allowed border-slate-200 text-slate-400"
            : "border-slate-300 text-slate-700 hover:bg-slate-50"}
        `}
        title="Dieser Knopf wird aktiv, wenn die Seite一个邮箱可用于重发"
      >
        {cooldown > 0 ? `Erneut senden (${cooldown}s)` : "Keine E-Mail erhalten? Erneut senden"}
      </button>
    </div>
  );
}
