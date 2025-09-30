// src/app/(app)/layout.tsx
import type { ReactNode } from "react";
import Sidebar from "../../../src/app/components/Sidebar";
import Feedback from "../../app/components/Feeback";
import "../globals.css";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">{children}</div>
      <div className="print:hidden" >
      <Feedback  formUrl="https://docs.google.com/forms/d/e/1FAIpQLSd7LMg3JjLYY1ugn7JWLBbckxC4MRFmh0H_iuC1b5udMAIQtQ/viewform?usp=header" />
      </div>
    </div>
  );
}
