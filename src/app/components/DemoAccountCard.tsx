"use client";
import React from "react";

export default function DemoAccountCard() {
  const demoEmail = "123@123.com";
  const demoPassword = "12345678";

  /** 将值写入输入框并触发 input 事件，兼容 react-hook-form */
  function fillField(selector: string, value: string) {
    const el = document.querySelector<HTMLInputElement>(selector);
    if (!el) return false;

    // 设置值
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    nativeInputValueSetter?.call(el, value);

    // 触发事件，让 RHF/React 捕获变更
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  function handleUseDemo() {
    // 优先把“登录表单”的邮箱/密码填上（也会顺带填注册表单同名字段，不影响）
    const emailFilled = fillField('input[name="email"]', demoEmail);
    const pwdFilled = fillField('input[name="password"]', demoPassword);

    // 如果当前界面正显示“注册”页，你可能想切回“登录”页再点登录；
    // 这里只做填充，不强制切 tab，避免误点。需要的话你可以在登录 tab 按钮上加 data-auth-tab="login" 并在此点击它。

    if (emailFilled && pwdFilled) {
      // 可选：把光标放到“登录”密码框
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
