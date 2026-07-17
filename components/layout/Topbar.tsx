"use client";

import Link from "next/link";
import { useUIStore } from "@/store/useUIStore";

type TopbarProps = {
  projectTitle: string;
};

export function Topbar({ projectTitle }: TopbarProps) {
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);

  return (
    <header className="flex items-center gap-3 border-b border-parchment/10 bg-ink px-4 py-3 md:px-6">
      {/* Hamburger — mobile only, buka MobileNav drawer */}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Buka navigasi"
        className="rounded p-1.5 text-parchment/70 hover:bg-parchment/10 hover:text-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass md:hidden"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="size-5"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Link
        href="/"
        className="hidden shrink-0 font-display text-lg font-semibold text-parchment hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass md:inline"
      >
        InkPad
      </Link>

      <span aria-hidden className="hidden text-parchment/30 md:inline">
        /
      </span>

      <h1 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-parchment">
        {projectTitle}
      </h1>

      {/* Placeholder actions (export dll) — diisi di fase berikutnya */}
    </header>
  );
}
