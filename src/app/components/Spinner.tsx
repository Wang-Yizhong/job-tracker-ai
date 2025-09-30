// --- file: src/components/Spinner.tsx
import React from "react";

export default function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-primary border-t-transparent"
      style={{ width: size, height: size }}
    />
  );
}
