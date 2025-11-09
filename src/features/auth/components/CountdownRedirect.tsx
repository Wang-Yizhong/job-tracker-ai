// --- file: src/features/auth/components/CountdownRedirect.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CountdownRedirect({
  seconds = 5,
  href = "/auth?mode=login&verified=1",
  prefillEmail,
}: {
  seconds?: number;
  href?: string;
  prefillEmail?: string;
}) {
  const router = useRouter();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (prefillEmail) {
      try {
        localStorage.setItem("auth_prefill_email", String(prefillEmail));
      } catch {}
    }
  }, [prefillEmail]);

  useEffect(() => {
    if (left <= 0) {
      router.replace(href);
      return;
    }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left, href, router]);

  return <p className="mt-4 text-sm text-slate-600">Du wirst in {left}s zur Anmeldung weitergeleitet …</p>;
}
