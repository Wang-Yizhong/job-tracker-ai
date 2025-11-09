"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AboutMe from "@/features/plan/components/AboutMe";
import Architecture from "@/features/plan/components/Architecture";
import ValueAndFlow from "@/features/plan/components/ValueAndFlow";
import Roadmap from "@/features/plan/components/Roadmap";
import Changelog from "@/features/plan/components/Changelog";

export default function PlanPage() {
  return (
    // 整页用 flex 列布局，限定一屏高度
    <div className="bg-background text-foreground h-screen flex flex-col">
      {/* Header（不滚动） */}
      <div className="shrink-0 px-6 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projektplan</h1>
          <div className="text-xs text-muted">letzte Aktualisierung: 29.09.2025</div>
        </div>
      </div>

      {/* Tabs 容器：列方向，列表不滚动，内容区滚动 */}
      <Tabs defaultValue="value" className="flex min-h-0 flex-1 flex-col px-6">
        {/* Tabs 列表（不滚动） */}
        <TabsList className="shrink-0 grid w-full grid-cols-5 rounded-xl bg-muted/20  mb-4">
          <TabsTrigger value="value" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            Bedeutung & Flow
          </TabsTrigger>
          <TabsTrigger value="architektur" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            Architektur
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            Roadmap
          </TabsTrigger>
          <TabsTrigger value="changelog" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            Changelog
          </TabsTrigger>
          <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            Über mich
          </TabsTrigger>
        </TabsList>

        {/* 内容滚动区 —— 关键：min-h-0 + flex-1 + overflow-auto */}
        <div className="min-h-0 flex-1 overflow-auto pr-1">
          <TabsContent value="value" className="h-full">
            <ValueAndFlow />
          </TabsContent>
          <TabsContent value="architektur" className="h-full">
            <Architecture />
          </TabsContent>
          <TabsContent value="roadmap" className="h-full">
            <Roadmap />
          </TabsContent>
          <TabsContent value="changelog" className="h-full">
            <Changelog />
          </TabsContent>
          <TabsContent value="about" className="h-full">
            <AboutMe />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
