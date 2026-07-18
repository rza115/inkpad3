"use client";

import type { SearchResultGroup } from "@/lib/actions/search";
import { SearchResultGroupComponent } from "./SearchResultGroup";

type SearchResultsDropdownProps = {
  groups: SearchResultGroup[];
  onClose: () => void;
  isVisible: boolean;
};

export function SearchResultsDropdown({
  groups,
  onClose,
  isVisible,
}: SearchResultsDropdownProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto rounded-lg border border-ink/20 bg-parchment shadow-lg z-50">
      {groups.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-slate/60">
          Tidak ada hasil ditemukan
        </div>
      ) : (
        <div className="py-2">
          {groups.map((group) => (
            <SearchResultGroupComponent
              key={group.type}
              group={group}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}
