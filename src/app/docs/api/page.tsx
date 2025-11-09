"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="p-6">
      <div className="text-2xl font-semibold mb-4">Job Tracker — API Docs</div>
      <SwaggerUI url="/api/v1/swagger" />
    </div>
  );
}
