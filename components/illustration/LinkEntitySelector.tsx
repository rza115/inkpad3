"use client";

import { useState, useEffect } from "react";
import { getCharacters } from "@/lib/actions/characters";
import { getChapters } from "@/lib/actions/chapters";
import { getScenes } from "@/lib/actions/scenes";
import { getWorldbuildingEntries } from "@/lib/actions/worldbuilding";

type EntityType = "character" | "scene" | "worldbuilding";

type LinkEntitySelectorProps = {
  projectId: string;
  entityType: EntityType;
  value: string | null;
  onChange: (value: string | null) => void;
};

type Option = {
  id: string;
  label: string;
};

export function LinkEntitySelector({
  projectId,
  entityType,
  value,
  onChange,
}: LinkEntitySelectorProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchOptions() {
      try {
        if (entityType === "character") {
          const data = await getCharacters(projectId);
          if (mounted) {
            setOptions(data.map((c) => ({ id: c.id, label: c.name })));
          }
        } else if (entityType === "scene") {
          // Fetch semua chapter dulu, lalu semua scene
          const chapters = await getChapters(projectId);
          const allScenes: Option[] = [];

          for (const chapter of chapters) {
            const scenes = await getScenes(chapter.id);
            scenes.forEach((scene, index) => {
              allScenes.push({
                id: scene.id,
                label: `${chapter.title} — Scene ${index + 1}`,
              });
            });
          }

          if (mounted) {
            setOptions(allScenes);
          }
        } else if (entityType === "worldbuilding") {
          const data = await getWorldbuildingEntries(projectId);
          if (mounted) {
            setOptions(
              data.map((w) => ({ id: w.id, label: `${w.category}: ${w.title}` }))
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch options:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchOptions();

    return () => {
      mounted = false;
    };
  }, [projectId, entityType]);

  if (loading) {
    return (
      <select
        disabled
        className="w-full rounded border border-slate/30 bg-parchment px-3 py-2 text-sm text-slate"
      >
        <option>Loading...</option>
      </select>
    );
  }

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded border border-slate/30 bg-parchment px-3 py-2 text-sm text-ink focus:border-wine focus:outline-none focus:ring-1 focus:ring-wine"
    >
      <option value="">— Tidak di-link —</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
