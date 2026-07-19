import type { Character } from "@/lib/actions/characters";
import type { WorldbuildingEntry } from "@/lib/actions/worldbuilding";

export type EntityRef = {
  id: string;
  type: "character" | "worldbuilding";
  name: string;
  aliases: string[];
  quickSummary: string;
  category?: string; // hanya worldbuilding
};

export type EntityMatch = {
  from: number; // posisi karakter di dalam teks node
  to: number;
  entity: EntityRef;
};

// Kandidat pencarian: satu string (nama utama atau alias) yang nempel ke satu EntityRef.
type Candidate = {
  lower: string;
  entity: EntityRef;
};

// Fallback popover: quick_summary kosong → 140 karakter pertama description/content,
// dipotong di word boundary terdekat + ellipsis.
function summaryFallback(quickSummary: string, longText: string): string {
  const trimmedSummary = quickSummary.trim();
  if (trimmedSummary) return trimmedSummary;

  const source = longText.trim();
  if (source.length <= 140) return source;

  const cut = source.slice(0, 140);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function buildEntityIndex(
  characters: Character[],
  worldbuilding: WorldbuildingEntry[]
): EntityRef[] {
  // Known limitation: kalau character & worldbuilding punya nama/alias identik,
  // character menang — urutan array ini (character duluan) yang menentukan
  // prioritas di findEntityMatches (sort stabil, tie panjang → urutan asal).
  const refs: EntityRef[] = [];

  for (const c of characters) {
    refs.push({
      id: c.id,
      type: "character",
      name: c.name,
      aliases: c.aliases,
      quickSummary: summaryFallback(c.quick_summary, c.description),
    });
  }

  for (const w of worldbuilding) {
    refs.push({
      id: w.id,
      type: "worldbuilding",
      name: w.title,
      aliases: w.aliases,
      quickSummary: summaryFallback(w.quick_summary, w.content),
      category: w.category,
    });
  }

  return refs;
}

// Word boundary aman untuk teks Bahasa Indonesia: karakter di sekitar match
// bukan huruf/angka (Unicode-aware) — bukan \b bawaan JS yang meleset di
// tanda baca seperti tanda pisah "—".
const WORD_CHAR = /[\p{L}\p{N}]/u;

function isBoundary(text: string, index: number): boolean {
  // index di luar teks = boundary (awal/akhir string).
  if (index < 0 || index >= text.length) return true;
  return !WORD_CHAR.test(text[index]);
}

export function findEntityMatches(
  text: string,
  index: EntityRef[]
): EntityMatch[] {
  if (!text) return [];

  // Nama utama + semua alias jadi kandidat, tiap kandidat nempel ke satu EntityRef.
  const candidates: Candidate[] = [];
  for (const entity of index) {
    for (const raw of [entity.name, ...entity.aliases]) {
      const lower = raw.trim().toLowerCase();
      if (lower) candidates.push({ lower, entity });
    }
  }

  // Longest match wins: kandidat terpanjang di-scan duluan dan klaim range-nya,
  // kandidat pendek yang overlap di-skip. Tie panjang → character duluan
  // (prioritas di atas worldbuilding saat nama/alias identik).
  candidates.sort((a, b) => {
    if (a.lower.length !== b.lower.length) {
      return b.lower.length - a.lower.length;
    }
    if (a.entity.type === b.entity.type) return 0;
    return a.entity.type === "character" ? -1 : 1;
  });

  const lowerText = text.toLowerCase();
  const matches: EntityMatch[] = [];
  // Range yang sudah diklaim match sebelumnya (buat cek overlap).
  const claimed: Array<{ from: number; to: number }> = [];

  for (const candidate of candidates) {
    let pos = 0;
    while (pos <= lowerText.length - candidate.lower.length) {
      const found = lowerText.indexOf(candidate.lower, pos);
      if (found === -1) break;

      const from = found;
      const to = found + candidate.lower.length;
      pos = found + 1;

      // Case-insensitive match tapi casing asli teks tidak diubah — decoration
      // cuma nambah underline di range [from, to).
      if (!isBoundary(text, from - 1) || !isBoundary(text, to)) continue;
      if (claimed.some((r) => from < r.to && to > r.from)) continue;

      claimed.push({ from, to });
      matches.push({ from, to, entity: candidate.entity });
    }
  }

  matches.sort((a, b) => a.from - b.from);
  return matches;
}
