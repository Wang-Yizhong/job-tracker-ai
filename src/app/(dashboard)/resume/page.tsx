// --- file: src/app/(dashboard)/resume/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import StepHeader from "@/features/resume/components/StepHeader";
import { useResumeStepStore } from "@/features/resume/store/useResumeStepStore";
import UploadSection from "@/features/resume/components/step1/UploadSection";
import JDSection from "@/features/resume/components/step1/JDSection";
import GuideCard from "@/features/resume/components/step1/GuideCard";

const STORAGE_ANALYSE_KEY = "resume:pendingAnalyse";

export default function ResumePage() {
  const router = useRouter();

  // Step 指示
  const step = useResumeStepStore((s) => s.step);
  const setStep = useResumeStepStore((s) => s.setStep);

  // Store 读/写能力
  const hasHydrated     = useResumeStepStore((s: any) => s.hasHydrated ?? false);
  const jdText          = useResumeStepStore((s) => s.jdText);
  const setJD           = useResumeStepStore((s) => s.setJD);
  const setUploadSource = useResumeStepStore((s) => s.setUploadSource);

  // 可选：如果你这里还有 fileKey/fileName 的本地使用就保留
  const fileKey  = useResumeStepStore((s) => s.fileKey);
  const fileName = useResumeStepStore((s) => s.fileName);

  // ✅ 页面挂载时：从 sessionStorage 恢复一次性“待分析”数据 → 写入 store → 立刻清掉
  React.useEffect(() => {
    if (typeof window === "undefined" || !hasHydrated) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_ANALYSE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw) as {
        jdText?: string;
        fileKey?: string;
        fileName?: string | null;
        // 可能还有其他字段：source/jobId/title/company/location/link/ts...
      };

      // 仅在 store 为空时回填，避免覆盖用户已输入内容
      if (typeof data.jdText === "string" && data.jdText.trim()) {
        if (!jdText?.trim()) {
          setJD(data.jdText);
        }
      }

      // 可选：若带有 fileKey/fileName（如从上传入口），也同步回填
      if (typeof data.fileKey === "string" && data.fileKey) {
        setUploadSource({
          fileKey: data.fileKey,
          fileName: typeof data.fileName === "string" ? data.fileName : (data.fileName ?? ""),
        });
      }

      // 一次性消息，用完即焚
      sessionStorage.removeItem(STORAGE_ANALYSE_KEY);
    } catch (e) {
      console.warn("Failed to restore pending analyse payload:", e);
    }
    // 依赖里包含 jdText，可避免重复覆盖；hasHydrated 确保仅在客户端且 rehydrate 后执行
  }, [hasHydrated, jdText, setJD, setUploadSource]);

  // 原“开始分析”逻辑保持不变（如你需要）
  const handleStartAnalyse = React.useCallback(() => {
    if (!fileKey || !jdText?.trim()) {
      alert("Bitte lade zuerst eine Datei hoch und füge die Stellenbeschreibung ein.");
      return;
    }
    try {
      sessionStorage.setItem(
        STORAGE_ANALYSE_KEY,
        JSON.stringify({ fileKey, fileName, jdText })
      );
    } catch (e) {
      console.warn("persist analyse payload failed:", e);
    }
    router.push(`/resume/analyse?fileKey=${encodeURIComponent(fileKey)}`);
  }, [fileKey, fileName, jdText, router]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <StepHeader current={step} onChange={setStep} />

      {/* 价值引导 */}
      <GuideCard />

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：上传/历史 */}
        <div className="col-span-12 lg:col-span-4">
          <UploadSection />
        </div>

        {/* 右侧：JD 粘贴 + 开始分析 */}
        <div className="col-span-12 lg:col-span-8">
          <JDSection />
          {/* 如果你还需要在此处用按钮触发 handleStartAnalyse，再挂一个按钮即可 */}
        </div>
      </div>
    </div>
  );
}
