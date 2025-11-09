// --- file: src/features/auth/components/DemoAccountCard.tsx
"use client";
import React from "react";

export default function DemoAccountCard() {
  const demoEmail = "123@123.com";
  const demoPassword = "12345678";

  function fillField(selector: string, value: string) {
    const el = document.querySelector<HTMLInputElement>(selector);
    if (!el) return false;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    nativeSetter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  function handleUseDemo() {
    const emailFilled = fillField('input[name="email"]', demoEmail);
    const pwdFilled = fillField('input[name="password"]', demoPassword);
    if (emailFilled && pwdFilled) {
      const pwdEl = document.querySelector<HTMLInputElement>('input[name="password"]');
      pwdEl?.focus();
    } else {
      alert("Konnte die Felder nicht finden. Bitte öffne die Anmeldeseite.");
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <h3 className="mb-2 text-sm font-semibold text-slate-800">Schnelltest (Demo-Konto)</h3>
      <p className="text-xs text-slate-600 mb-2">
        Nutze das Demo-Konto zum schnellen Ausprobieren.
      </p>
      <div className="space-y-1">
        <p className="text-xs">
          <span className="font-medium">E-Mail:</span> {demoEmail}
        </p>
        <p className="text-xs">
          <span className="font-medium">Passwort:</span> {demoPassword}
        </p>
      </div>

      <button
        onClick={handleUseDemo}
        className="mt-3 w-full rounded-xl bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-700"
      >
        Demo-Account verwenden
      </button>
    </div>
  );
}
