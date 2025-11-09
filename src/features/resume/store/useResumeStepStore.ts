// --- file: src/features/resume/store/useResumeStepStore.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type StepIndex = 1 | 2 | 3;
export type ResumeLang = "de" | "en";
export const MIN_JD_LEN = 100;

/* ======================= State & Actions ======================= */
type State = {
  step: StepIndex;
  fileKey?: string;
  fileName?: string;
  selectedSeriesId?: string;
  selectedVersionId?: string;
  lang: ResumeLang;
  jdText: string;
  hasHydrated: boolean;
};

type Actions = {
  setStep: (s: StepIndex) => void;
  setUploadSource: (p: { fileKey: string; fileName: string }) => void;
  clearUploadSource: () => void;

  /** 历史选择：允许同时写入 fileKey/fileName（不强行清空） */
  setHistorySource: (p: {
    seriesId: string;
    versionId: string;
    fileKey?: string;
    fileName?: string;
  }) => void;
  clearHistorySource: () => void;

  setLang: (l: ResumeLang) => void;
  setJD: (text: string) => void;
  reset: () => void;
  _setHasHydrated: (v: boolean) => void;
};

const STORE_KEY = "resume:step1";

/* ======================= Factory ======================= */
function createResumeStore() {
  return create<State & Actions>()(
    persist(
      (set) => ({
        step: 1,
        lang: "de",
        jdText: "",
        hasHydrated: false,

        setStep: (s) => set({ step: s }),

        setUploadSource: ({ fileKey, fileName }) =>
          set({
            fileKey,
            fileName,
            selectedSeriesId: undefined,
            selectedVersionId: undefined,
          }),

        clearUploadSource: () => set({ fileKey: undefined, fileName: undefined }),

        /** 历史选择时同步写入版本信息；若未传入则保留现值 */
        setHistorySource: ({ seriesId, versionId, fileKey, fileName }) =>
          set((prev) => ({
            selectedSeriesId: seriesId,
            selectedVersionId: versionId,
            fileKey: fileKey ?? prev.fileKey,
            fileName: fileName ?? prev.fileName,
          })),

        clearHistorySource: () =>
          set({ selectedSeriesId: undefined, selectedVersionId: undefined }),

        setLang: (l) => set({ lang: l }),
        setJD: (text) => set({ jdText: text }),

        reset: () =>
          set({
            step: 1,
            lang: "de",
            jdText: "",
            fileKey: undefined,
            fileName: undefined,
            selectedSeriesId: undefined,
            selectedVersionId: undefined,
          }),

        _setHasHydrated: (v) => set({ hasHydrated: v }),
      }),
      {
        name: STORE_KEY,
        storage: createJSONStorage(() => sessionStorage),
        version: 3,
        // ✅ 显式标注 s 的类型，避免 noImplicitAny 报错
        partialize: (s: State & Actions) => ({
          step: s.step,
          fileKey: s.fileKey,
          fileName: s.fileName,
          selectedSeriesId: s.selectedSeriesId,
          selectedVersionId: s.selectedVersionId,
          lang: s.lang,
          jdText: s.jdText,
        }),
        onRehydrateStorage: () => (state) => {
          state?._setHasHydrated(true);
        },
      }
    )
  );
}

/* ======================= Global Singleton (typed) ======================= */
/** 为导出的 hook 声明精准类型，避免被 `any` 污染 */
type ResumeStoreHook = ReturnType<typeof createResumeStore>;

declare global {
  // eslint-disable-next-line no-var
  var __resumeStepStore__: ResumeStoreHook | undefined;
}

export const useResumeStepStore: ResumeStoreHook =
  globalThis.__resumeStepStore__ ??
  (globalThis.__resumeStepStore__ = createResumeStore());

/* ======================= 派生选择器 ======================= */
export const useHasResumeSource = () =>
  useResumeStepStore(
    (s) => !!(s.fileKey || (s.selectedSeriesId && s.selectedVersionId))
  );

export const useCanAnalyse = (min = MIN_JD_LEN) =>
  useResumeStepStore(
    (s) =>
      (!!s.fileKey || (s.selectedSeriesId && s.selectedVersionId)) &&
      s.jdText.trim().length >= min
  );
