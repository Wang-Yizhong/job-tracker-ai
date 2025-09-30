// components/Modal.tsx
"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  labelledById?: string;
  widthClass?: string; // 允许自定义宽度
};

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  labelledById = "modal-title",
  widthClass = "w-[92vw] max-w-3xl",
}: ModalProps) {
  // ESC 关闭 & 背景滚动锁定
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          aria-hidden={!open}
        >
          {/* 背景遮罩 */}
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* 对话框 */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledById}
            className={`
              relative ${widthClass} max-h-[85vh]
              rounded-2xl border border-border bg-white shadow-xl
              flex flex-col
            `}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/70">
              <h2 id={labelledById} className="text-lg font-semibold text-foreground">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>

            {/* 内容 */}
            <div className="px-5 py-4 overflow-auto">
              {children}
            </div>

            {/* 底部 */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border/70">
              {footer}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
