// --- file: src/components/ui/common/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  LogOut,
  User,
  LayoutDashboard,
  Briefcase,
  FileText,
  Bell,
} from "lucide-react";
import { useUserInfo } from "@/features/user/hooks/useUserInfo";
import { useLogout } from "@/features/auth/hooks/useLogout";

/** 仅负责 UI 展示；数据/动作由 hooks 提供 */
const mainNav = [
  { href: "/dashboard", label: "Übersicht", Icon: LayoutDashboard },
  { href: "/jobs", label: "Stellen", Icon: Briefcase },
  { href: "/resume", label: "Lebenslauf", Icon: FileText },
];
const planNav = [{ href: "/plan", label: "Projektplan", Icon: Bell }];

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const { user, loading } = useUserInfo();
  const { logout, loggingOut } = useLogout(); // ← 按你的 hook 形状
  const [menuOpen, setMenuOpen] = useState(false);

  const avatarLetter = useMemo(
    () => (user?.name?.[0] || user?.email?.[0] || "-")!.toUpperCase(),
    [user]
  );

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className="
        relative hidden w-60 shrink-0 overflow-hidden md:block
        border-r border-border
        bg-white/90 backdrop-blur-md
        shadow-[0_2px_12px_rgba(0,0,0,0.06)]
        p-4
        transition-shadow
        hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]
      "
      aria-label="Sidebar Navigation"
    >
      {/* 背景柔光 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(79,70,229,0.18), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-6 h-48 w-48 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(6,182,212,0.14), transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="mb-4 flex items-center gap-2 px-1">
        <img
          src="/img/sidebar_logo.png"
          alt="Job Tracker"
          className="h-9 w-auto object-contain"
        />
      </div>

      {/* 主导航 */}
      <nav className="space-y-1" aria-label="Main">
        {mainNav.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group relative block rounded-xl px-3 py-2 hover:bg-background transition-colors"
            aria-current={isActive(href) ? "page" : undefined}
          >
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r ${
                isActive(href)
                  ? "bg-primary"
                  : "bg-transparent group-hover:bg-gray-200"
              }`}
            />
            <span className="flex items-center gap-2 pl-2">
              <Icon
                size={18}
                className={`${
                  isActive(href) ? "text-primary" : "text-gray-500"
                } transition-colors`}
              />
              <span
                className={`${
                  isActive(href)
                    ? "font-medium text-foreground"
                    : "text-foreground"
                }`}
              >
                {label}
              </span>
            </span>
            {isActive(href) && (
              <span className="absolute inset-0 -z-10 rounded-xl ring-1 ring-border" />
            )}
          </Link>
        ))}
      </nav>

      {/* 分组标题：项目计划 */}
      <div className="mt-5 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
        Plan
      </div>
      <nav className="space-y-1" aria-label="Plan">
        {planNav.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group relative block rounded-xl px-3 py-2 hover:bg-background transition-colors"
          >
            <span className="flex items-center gap-2 pl-2">
              <Icon size={18} className="text-gray-500" />
              <span className="text-foreground">{label}</span>
            </span>
          </Link>
        ))}
      </nav>

      {/* 账号菜单 */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 hover:bg-background transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700">
              {avatarLetter}
            </div>
            <span className="truncate text-sm text-foreground/90 font-bold">
              {loading ? "Loading…" : user?.email ?? "—"}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute bottom-12 left-0 w-56 rounded-2xl border border-border bg-white py-1 shadow-lg backdrop-blur"
            >
           {/*    <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-background"
                onClick={() => {
                  setMenuOpen(false);
                }}
              >
                <User size={16} /> Profil
              </button>
              <hr className="my-1 border-border" /> */}
              <button
                onClick={() => logout()}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-background disabled:opacity-60"
              >
                <LogOut size={16} />
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
