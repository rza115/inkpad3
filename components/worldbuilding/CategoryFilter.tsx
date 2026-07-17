"use client";

// Filter kategori — dipisah biar WorldbuildingList tetap tipis.
type CategoryFilterProps = {
  categories: string[];
  active: string | null;
  onChange: (category: string | null) => void;
};

export function CategoryFilter({
  categories,
  active,
  onChange,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div role="group" aria-label="Filter kategori" className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={active === null}
        className={`rounded-full border px-2.5 py-0.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine ${
          active === null
            ? "border-wine bg-wine text-parchment"
            : "border-slate/40 text-slate hover:border-wine hover:text-wine"
        }`}
      >
        Semua
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          aria-pressed={active === category}
          className={`rounded-full border px-2.5 py-0.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine ${
            active === category
              ? "border-wine bg-wine text-parchment"
              : "border-slate/40 text-slate hover:border-wine hover:text-wine"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
