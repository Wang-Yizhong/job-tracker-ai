"use client";

import * as React from "react";
import AnnouncementBar from "@/features/auth/components/AnnouncementBar";
import DemoAccountCard from "@/features/auth/components/DemoAccountCard";
import LoginForm from "@/features/auth/components/LoginForm";
import RegisterForm from "@/features/auth/components/RegisterForm";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = React.useState<Mode>("login");
  const [verifyEmail, setVerifyEmail] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);
  const cooldownActive = cooldown > 0;
  const title = mode === "login" ? "Willkommen zurück" : "Konto erstellen";

  React.useEffect(() => {
    if (!cooldownActive) return;
    const id = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldownActive]);

  return (
    <div
  className="
    min-h-[100dvh] grid place-items-center p-6 relative overflow-hidden
    bg-gradient-to-br from-[#F9FAFB] via-[#EEF1FF] to-[#E0EAFF]
    text-foreground
  "
>
  {/* 光晕层（主品牌色渐变） */}
  <div
    aria-hidden
    className="
      pointer-events-none absolute inset-0 -z-10
      bg-[radial-gradient(50rem_40rem_at_70%_-10%,hsl(var(--primary)/0.15),transparent)]
    "
  />

      <div className="w-full max-w-md">
        <AnnouncementBar />

        <div className="mb-6 text-center">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-1 text-[0.95rem] text-muted-foreground">
            Job Tracker – sichere Anmeldung
          </p>
        </div>

        <div
          className={`
            rounded-3xl border border-border bg-card/80 text-card-foreground
            backdrop-blur-xl p-6
            shadow-[0_10px_40px_rgba(0,0,0,0.08)]
          `}
        >
          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-full bg-input/40 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={
                mode === "login"
                  ? "rounded-full px-4 py-2 text-sm font-medium bg-card shadow-sm"
                  : "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              }
            >
              Anmeldung
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setVerifyEmail(null);
              }}
              className={
                mode === "register"
                  ? "rounded-full px-4 py-2 text-sm font-medium bg-card shadow-sm"
                  : "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              }
            >
              Registrieren
            </button>
          </div>

          {/* 表单保持原逻辑 */}
          {mode === "login" ? (
            <LoginForm
              onSwitchToRegister={() => {
                setMode("register");
                setVerifyEmail(null);
              }}
              onSuccessGoDashboard
            />
          ) : (
            <RegisterForm
              cooldown={cooldown}
              setCooldown={setCooldown}
              onEmailSent={(email) => setVerifyEmail(email)}
              onAlreadyVerified={(email, password) => {
                try {
                  localStorage.setItem("auth_prefill_email", email);
                  localStorage.setItem("auth_prefill_pwd", password);
                } catch {}
                setVerifyEmail(null);
                setMode("login");
              }}
              onSwitchToLogin={() => {
                setVerifyEmail(null);
                setMode("login");
              }}
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Hinweis: Dieses Projekt ist ein Demo-Projekt und dient ausschließlich der technischen Demonstration.
        </p>
      </div>

      {mode === "login" && <DemoAccountCard />}
    </div>
  );
}
