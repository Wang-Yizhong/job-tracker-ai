"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, Briefcase, FileText,Bell } from "lucide-react";
import {http} from "@/lib/axios";

type Me =
  | {
      id?: string;
      email?: string;
      name?: string;
      avatarUrl?: string;
    }
  | null;

const mainNav = [
  { href: "/dashboard", label: "Übersicht", Icon: LayoutDashboard },
  { href: "/jobs", label: "Stellen", Icon: Briefcase },
  { href: "/resume", label: "Lebenslauf", Icon: FileText },
];

// ✅ 只保留「项目开发计划」
const planNav = [{ href: "/plan", label: "Projektplan", Icon: Bell }];


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState<Me>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await http.get<{ user: Me }>("/userInfo", {
          headers: { "Cache-Control": "no-store" },
        });
        if (!cancelled) setMe(data?.user ?? null);
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoadingMe(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await http.post("/logout");
      router.push("/auth");
    } catch (err: any) {
      console.error("Logout error:", err);
      alert(err?.response?.data?.error || "Logout fehlgeschlagen!");
    }
  };

  const avatarLetter = (me?.name?.[0] || me?.email?.[0] || "-").toUpperCase();

  const NavList = ({
    items,
  }: {
    items: { href: string; label: string; Icon: any }[];
  }) => {
    const pathnameNow = pathname || "/";
    return (
      <nav className="space-y-1">
        {items.map(({ href, label, Icon }) => {
          const active =
            pathnameNow === href || pathnameNow.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="
                group relative block rounded-xl px-3 py-2
                hover:bg-background transition-colors
              "
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r
                ${active ? "bg-primary" : "bg-transparent group-hover:bg-gray-200"}`}
              />
              <span className="flex items-center gap-2 pl-2">
                <Icon
                  size={18}
                  className={`${active ? "text-primary" : "text-gray-500"} transition-colors`}
                />
                <span
                  className={`${active ? "font-medium text-foreground" : "text-foreground"}`}
                >
                  {label}
                </span>
              </span>
              {active && (
                <span className="absolute inset-0 -z-10 rounded-xl ring-1 ring-border" />
              )}
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <aside
      className="
        relative hidden w-60 shrink-0 overflow-hidden
        border-r border-border bg-white p-4 md:block
      "
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
      <NavList items={mainNav} />

      {/* 分组标题：项目计划 */}
      <div className="mt-5 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
        Plan
      </div>
      <NavList items={planNav} />

      {/* 账号菜单 */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="
              flex w-full items-center gap-2 rounded-xl px-3 py-2
              hover:bg-background transition-colors
            "
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700">
              {avatarLetter}
            </div>
            <span className="truncate text-sm text-foreground/90 font-bold">
              {loadingMe ? "Loading…" : me?.email ?? "—"}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="
                absolute bottom-12 left-0 w-56 rounded-2xl border border-border
                bg-white py-1 shadow-lg backdrop-blur
              "
            >
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-background"
                onClick={() => {
                  setMenuOpen(false);
                  // 可在此跳转到 /account 或 /profile，如需的话
                }}
              >
                <User size={16} /> Profil
              </button>
              <hr className="my-1 border-border" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-background"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
