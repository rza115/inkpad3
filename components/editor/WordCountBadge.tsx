"use client";

import { useEditorStore } from "@/store/useEditorStore";

const WORDS_PER_MINUTE = 200;

// Total word count seluruh scene di chapter + estimasi reading time.
// Monospace — kesan mesin tik untuk metadata manuscript.
export function WordCountBadge() {
  const wordCounts = useEditorStore((s) => s.wordCounts);
  const total = Object.values(wordCounts).reduce((sum, n) => sum + n, 0);
  const minutes = Math.max(1, Math.round(total / WORDS_PER_MINUTE));

  return (
    <p className="font-mono text-xs text-slate">
      {total.toLocaleString("id-ID")} kata · ±{minutes} menit baca
    </p>
  );
}
