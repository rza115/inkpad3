"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { searchProject, type SearchResultGroup } from "@/lib/actions/search";
import { SearchResultsDropdown } from "./SearchResultsDropdown";

type SearchBarProps = {
  projectId: string;
};

export function SearchBar({ projectId }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search (500ms)
  useEffect(() => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      // Reset via timeout untuk avoid sync setState in effect
      const timer = setTimeout(() => {
        setGroups([]);
        setIsOpen(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await searchProject(projectId, trimmedQuery);
        if (result.success) {
          setGroups(result.groups);
          setIsOpen(true);
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [query, projectId]);

  // Close dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleClose() {
    setIsOpen(false);
    setQuery("");
    setGroups([]);
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && groups.length > 0 && setIsOpen(true)}
          placeholder="Search..."
          className="w-full rounded border border-parchment/20 bg-ink/50 px-3 py-1.5 pr-8 text-sm text-parchment placeholder:text-parchment/50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass"
        />
        {isPending && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <svg
              aria-hidden
              className="size-4 animate-spin text-parchment/50"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      <SearchResultsDropdown
        groups={groups}
        onClose={handleClose}
        isVisible={isOpen}
      />
    </div>
  );
}
