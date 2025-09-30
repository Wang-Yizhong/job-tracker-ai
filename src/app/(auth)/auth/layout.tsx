// src/app/(auth)/layout.tsx
import type { ReactNode } from "react";
import "../../globals.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
      {children}
    </div>
  );
}
