"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function AIAnalyzingLoader({
  text = "AI is analyzing your resume…",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center text-center py-20 ${className}`}
    >
      {/* 背景流动渐变 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 blur-3xl"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* 发光核心 */}
      <motion.div
        className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg"
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 12px rgba(79,70,229,0.5)",
            "0 0 25px rgba(6,182,212,0.5)",
            "0 0 12px rgba(79,70,229,0.5)",
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="w-10 h-10 text-white" />
      </motion.div>

      {/* 渐变文字 */}
      <motion.p
        className="mt-10 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent text-lg font-semibold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      >
        {text}
      </motion.p>

      {/* 三点跳动 */}
      <div className="mt-3 flex items-center space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-primary/70"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              delay: i * 0.3,
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
