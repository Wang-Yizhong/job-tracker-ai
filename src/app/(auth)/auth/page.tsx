"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import AnnouncementBar from "../../components/AnnouncementBar";
import DemoAccountCard from "../../components/DemoAccountCard";
import api from "@/lib/axios"; // ✅ 统一使用封装的 axios

// ---------- Validation Schemas (German messages) ----------
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben."),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Bitte gib eine gültige E-Mail-Adresse ein." }),
  password: z.string().min(8, { message: "Das Passwort muss mindestens 8 Zeichen haben." }),
  acceptTos: z.literal(true, { errorMap: () => ({ message: "Bitte stimme zuerst den Bedingungen zu." }) }),
});

// ---------- Types ----------
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type Mode = "login" | "register";

// ---------- Utilities ----------
function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}
function AppLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "w-full rounded-2xl px-4 py-2 text-sm font-medium text-white shadow",
        "bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50",
        loading && "opacity-70 cursor-wait"
      )}
    >
      {loading ? "Bitte warten …" : children}
    </button>
  );
}
function Divider({ text = "oder" }) {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-2 text-xs text-gray-500">{text}</span>
      </div>
    </div>
  );
}

export default function AuthPage() {
  // 👇 默认登录模式
  const [mode, setMode] = useState<Mode>("login");

  // Nach Registrierung: Hinweis "E-Mail prüfen" + Cooldown
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const cooldownActive = cooldown > 0;

  // Hält die zuletzt eingegebenen Registrierungswerte temporär (nur im Client)
  const lastRegisterRef = useRef<RegisterValues | null>(null);

  // Login-Formular
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin, isSubmitting: isSubmittingLogin },
    reset: resetLogin,
    setValue: setLoginValue,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  // Registrieren-Formular
  const {
    register: registerRegister,
    handleSubmit: handleSubmitRegister,
    formState: { errors: errorsRegister, isSubmitting: isSubmittingRegister },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const loading = isSubmittingLogin || isSubmittingRegister;
  const title = useMemo(() => (mode === "login" ? "Willkommen zurück" : "Konto erstellen"), [mode]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      try {
        registerSchema.parse({ email: "ok@ok.com", password: "xxxxxxxx", acceptTos: true });
      } catch {}
    }
  }, []);

  // Login submit  ✅ 改为 api.post
  async function onSubmitLogin(values: LoginValues) {
    try {
      await api.post("/login", values);
      window.location.assign("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Anmeldung fehlgeschlagen.";
      alert(msg);
    }
  }

  // Registrieren submit  ✅ 改为 api.post（含已存在逻辑）
  async function onSubmitRegister(values: RegisterValues) {
    try {
      lastRegisterRef.current = values;
      const payload = { email: values.email, password: values.password };

      const data = await api.post("/register", payload);

      if (data?.alreadyVerified) {
        setMode("login");
        resetLogin({
          email: values.email,
          password: values.password,
          rememberMe: false,
        });
        alert("Diese E-Mail wurde bereits verifiziert. Bitte melde dich an.");
        return;
      }

      setVerifyEmail(values.email);
      setCooldown(3);
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.error || err?.message || "Registrierung fehlgeschlagen.";

      if (status === 409 || code === "EMAIL_EXISTS") {
        setMode("login");
        resetLogin({
          email: values.email,
          password: values.password,
          rememberMe: false,
        });
        alert("Diese E-Mail ist bereits registriert. Bitte melde dich an.");
        return;
      }
      alert(msg);
    }
  }

  // Cooldown-Timer
  useEffect(() => {
    if (!cooldownActive) return;
    const timer = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldownActive]);

  // Verifizierungsmail erneut senden  ✅ 改为 api.post
  async function handleResend() {
    if (!verifyEmail || cooldownActive) return;
    try {
      await api.post("/resend-verify", { email: verifyEmail });
      setCooldown(60);
    } catch (e) {
      setCooldown(60);
      console.warn("Resend fehlgeschlagen:", e);
    }
  }

  return (
    <div className="min-h-[100dvh] grid place-items-center bg-white p-4">
      <div className="w-full max-w-md">
        <AnnouncementBar />
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">Job Tracker – sichere Anmeldung</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                mode === "login" ? "bg-white shadow text-slate-900" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Anmeldung
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                mode === "register" ? "bg-white shadow text-slate-900" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Registrieren
            </button>
          </div>

          {/* Register success notice */}
          {mode === "register" && verifyEmail ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <h2 className="text-sm font-semibold text-emerald-900">Verifizierungs-E-Mail gesendet</h2>
                <p className="mt-1 text-sm text-emerald-800">
                  Wir haben eine E-Mail an <span className="font-medium">{verifyEmail}</span> gesendet.
                  Bitte klicke innerhalb von 24 Stunden auf den Link, um deine E-Mail zu bestätigen.
                </p>
              </div>

              <button
                onClick={handleResend}
                disabled={cooldownActive}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-sm font-medium",
                  cooldownActive
                    ? "cursor-not-allowed border-gray-200 text-gray-400"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                )}
              >
                {cooldownActive ? `Erneut senden (${cooldown}s)` : "Keine E-Mail erhalten? Erneut senden"}
              </button>

              <Divider text="oder" />

              <p className="text-center text-sm text-slate-600">
                Bereits bestätigt?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                  }}
                  className="font-medium text-primary-600 hover:underline"
                >
                  Jetzt anmelden
                </button>
              </p>
            </div>
          ) : mode === "login" ? (
            // Login form
            <form className="space-y-4" onSubmit={handleSubmitLogin(onSubmitLogin)}>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                <input
                  {...registerLogin("email")}
                  type="email"
                  placeholder="du@beispiel.de"
                  autoComplete="email"
                  className={cn(
                    "w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none",
                    "focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500",
                    errorsLogin.email ? "border-red-400" : "border-gray-300"
                  )}
                />
                {errorsLogin.email && <p className="text-xs text-red-600">{errorsLogin.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Passwort</label>
                <input
                  {...registerLogin("password")}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    "w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none",
                    "focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500",
                    errorsLogin.password ? "border-red-400" : "border-gray-300"
                  )}
                />
                {errorsLogin.password && <p className="text-xs text-red-600">{errorsLogin.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" {...registerLogin("rememberMe")} className="h-4 w-4" />
                  Eingeloggt bleiben
                </label>
              </div>

              <SubmitButton loading={loading}>Anmelden</SubmitButton>

              <Divider text="oder" />

              <p className="text-center text-sm text-slate-600">
                Neu hier?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setVerifyEmail(null);
                  }}
                  className="font-medium text-primary-600 hover:underline"
                >
                  Konto erstellen
                </button>
              </p>
            </form>
          ) : (
            // Register form
            <form className="space-y-4" onSubmit={handleSubmitRegister(onSubmitRegister)}>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                <input
                  {...registerRegister("email")}
                  type="email"
                  placeholder="du@beispiel.de"
                  autoComplete="email"
                  className={cn(
                    "w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none",
                    "focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500",
                    errorsRegister.email ? "border-red-400" : "border-gray-300"
                  )}
                />
                {errorsRegister.email && <p className="text-xs text-red-600">{errorsRegister.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Passwort</label>
                <input
                  {...registerRegister("password")}
                  type="password"
                  placeholder="Mindestens 8 Zeichen"
                  autoComplete="new-password"
                  className={cn(
                    "w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none",
                    "focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500",
                    errorsRegister.password ? "border-red-400" : "border-gray-300"
                  )}
                />
                {errorsRegister.password && <p className="text-xs text-red-600">{errorsRegister.password.message}</p>}
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" {...registerRegister("acceptTos")} className="mt-1 h-4 w-4" />
                <span>
                  Ich stimme den <AppLink className="text-primary-600 hover:underline" href="#">
                    AGB
                  </AppLink>{" "}
                  und der{" "}
                  <AppLink className="text-primary-600 hover:underline" href="#">
                    Datenschutzerklärung
                  </AppLink>{" "}
                  zu.
                </span>
              </label>
              {errorsRegister.acceptTos && (
                <p className="text-xs text-red-600">{String(errorsRegister.acceptTos.message)}</p>
              )}

              <SubmitButton loading={loading}>Konto erstellen</SubmitButton>

              <Divider text="oder" />

              <p className="text-center text-sm text-slate-600">
                Bereits registriert?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setVerifyEmail(null);
                    const last = lastRegisterRef.current;
                    if (last) {
                      resetLogin({
                        email: last.email,
                        password: last.password,
                        rememberMe: false,
                      });
                    }
                  }}
                  className="font-medium text-primary-600 hover:underline"
                >
                  Zum Login
                </button>
              </p>

              <p className="mt-2 text-center text-xs text-emerald-700">
                Nach erfolgreicher Registrierung senden wir dir eine Verifizierungs-E-Mail.
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Hinweis: Dieses Projekt ist ein Demo-Projekt und dient ausschließlich der technischen Demonstration.
        </p>
      </div>
      {mode === "login" && <DemoAccountCard />}
    </div>
  );
}
