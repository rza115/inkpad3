"use client";

import type { SearchResultGroup } from "@/lib/actions/search";
import { SearchResultItem } from "./SearchResultItem";

type SearchResultGroupProps = {
  group: SearchResultGroup;
  onClose: () => void;
};

export function SearchResultGroupComponent({
  group,
  onClose,
}: SearchResultGroupProps) {
  const remaining = group.totalCount - group.results.length;

  return (
    <div className="border-b border-ink/10 last:border-0 pb-2 last:pb-0">
      <div className="px-3 py-1.5 font-mono text-xs font-medium text-slate">
        {group.label} ({group.totalCount})
      </div>
      <div className="flex flex-col">
        {group.results.map((result) => (
          <SearchResultItem key={result.id} result={result} onClose={onClose} />
        ))}
      </div>
      {remaining > 0 && (
        <div className="px-3 py-1 text-xs text-slate/60 italic">
          ... dan {remaining} lainnya
        </div>
      )}
    </div>
  );
}
