"use client";

import { useState, useTransition } from "react";
import type { Editor } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { createChapterVersion } from "@/lib/actions/versions";

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`rounded px-2 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass disabled:opacity-40 ${
        active
          ? "bg-parchment/20 font-semibold text-parchment"
          : "text-parchment/70 hover:bg-parchment/10 hover:text-parchment"
      }`}
    >
      {children}
    </button>
  );
}

type EditorToolbarProps = {
  editor: Editor | null;
  chapterId: string;
  historyOpen: boolean;
  onToggleHistory: () => void;
};

// Formatting controls untuk scene yang lagi fokus. Pola editor.isActive()
// (aturan anti-ambiguitas #5) — state toggle langsung dari TipTap.
export function EditorToolbar({
  editor,
  chapterId,
  historyOpen,
  onToggleHistory,
}: EditorToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  function handleSaveVersion() {
    startTransition(async () => {
      const result = await createChapterVersion(chapterId);
      if (result.error) {
        setSaveMsg(result.error);
      } else {
        setSaveMsg("Versi tersimpan");
        router.refresh(); // refresh daftar versi di panel
        setTimeout(() => setSaveMsg(null), 3000);
      }
    });
  }

  const disabled = !editor;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-parchment/10 bg-ink px-3 py-1.5">
      <ToolbarButton
        label="Bold"
        active={editor?.isActive("bold") ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor?.isActive("italic") ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor?.isActive("strike") ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <span className="line-through">S</span>
      </ToolbarButton>

      <span aria-hidden className="mx-1 h-5 w-px bg-parchment/20" />

      <ToolbarButton
        label="Heading"
        active={editor?.isActive("heading", { level: 2 }) ?? false}
        disabled={disabled}
        onClick={() =>
          editor?.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        H
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        active={editor?.isActive("bulletList") ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        ••
      </ToolbarButton>
      <ToolbarButton
        label="Blockquote"
        active={editor?.isActive("blockquote") ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        &ldquo;&rdquo;
      </ToolbarButton>

      <span className="flex-1" />

      {saveMsg && (
        <span role="status" className="font-mono text-xs text-brass">
          {saveMsg}
        </span>
      )}

      {/* Snapshot manual — aturan anti-ambiguitas #4 */}
      <button
        type="button"
        onClick={handleSaveVersion}
        disabled={isPending}
        className="rounded border border-brass/60 px-2.5 py-1 font-mono text-xs text-brass transition-colors hover:bg-brass/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass disabled:opacity-50"
      >
        {isPending ? "Menyimpan…" : "Simpan Versi"}
      </button>

      <button
        type="button"
        onClick={onToggleHistory}
        aria-pressed={historyOpen}
        className={`rounded px-2.5 py-1 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass ${
          historyOpen
            ? "bg-parchment/20 text-parchment"
            : "text-parchment/70 hover:bg-parchment/10 hover:text-parchment"
        }`}
      >
        Riwayat
      </button>
    </div>
  );
}
