"use client";

import Link from "next/link";
import type { SearchResult } from "@/lib/actions/search";

type SearchResultItemProps = {
  result: SearchResult;
  onClose: () => void;
};

export function SearchResultItem({ result, onClose }: SearchResultItemProps) {
  return (
    <Link
      href={result.targetUrl}
      onClick={onClose}
      className="block rounded px-3 py-2 hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
    >
      <div className="font-medium text-sm text-ink">{result.title}</div>
      {result.excerpt && (
        <div className="mt-0.5 text-xs text-slate/80 line-clamp-1">
          {result.excerpt}
        </div>
      )}
    </Link>
  );
}
