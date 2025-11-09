// src/app/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import Sidebar from "@/components/ui/common/Sidebar";
import "../globals.css";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    // 整体一屏，不可滚动
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* 左侧 Sidebar */}
      <Sidebar />

      {/* 主区域：占满剩余空间 */}
      <div className="flex flex-1 h-full overflow-hidden">
        {/* 柔光背景层 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10"
        />

        {/* 内容区域：内部可滚动 */}
        <main className="relative z-10 flex-1 h-full px-[15px] overflow-hidden">
          <div
            className="
              h-full flex flex-col border border-border bg-white shadow-[0_1px_6px_rgba(0,0,0,0.04)]
              overflow-hidden
            "
          >
            {/* ✅ 最终滚动层（children 内部表格等在这里滚动） */}
            <div className="flex-1 overflow-hidden p-3 md:p-4">
              {children}
            </div>
          </div>
        </main>
      </div>

    
    </div>
  );
}
