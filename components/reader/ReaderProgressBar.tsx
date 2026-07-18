"use client";

import { useEffect, useRef } from "react";

// Indikator posisi baca: bar tipis fixed di atas, lebar = scroll % dokumen.
// Update via ref (bukan state) supaya tidak re-render tiap frame scroll;
// scaleX compositor-only, murah.
export function ReaderProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.documentElement;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const progress = max > 0 ? el.scrollTop / max : 0;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
      aria-hidden="true"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-[var(--reader-accent)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
