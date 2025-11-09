"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerClient({ url }: { url: string }) {
  return (
    <div className="p-6">
      <div className="text-2xl font-semibold mb-4">Job Tracker — API Docs</div>
      <SwaggerUI url={url} docExpansion="none" />
    </div>
  );
}
