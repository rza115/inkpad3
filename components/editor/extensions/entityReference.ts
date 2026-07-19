import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { findEntityMatches, type EntityRef } from "@/lib/editor/entityIndex";

type EntityReferenceOptions = {
  entityIndex: EntityRef[];
};

type EntityReferenceStorage = {
  entityIndex: EntityRef[];
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    entityReference: {
      /** Refresh index tanpa remount editor (characters/worldbuilding berubah). */
      updateEntityIndex: (newIndex: EntityRef[]) => ReturnType;
    };
  }
}

const entityReferenceKey = new PluginKey<DecorationSet>("entityReference");

// Scan seluruh doc → DecorationSet inline per match. Decoration murni kasih
// class+data-attribute ke span teks (popover di-render terpisah via React,
// bukan widget/NodeView) — konten dokumen tidak berubah, export tetap bersih.
function buildDecorations(doc: PMNode, index: EntityRef[]): DecorationSet {
  if (index.length === 0) return DecorationSet.empty;

  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    // Skip node kode (StarterKit sekarang belum include code block, jaga-jaga).
    if (node.type.spec.code) return false;

    // Per textblock (bukan per text node) supaya match tidak putus kalau
    // teks kepecah beberapa text node karena mark (bold/italic di tengah nama).
    const text = node.textContent;
    for (const match of findEntityMatches(text, index)) {
      decorations.push(
        Decoration.inline(pos + 1 + match.from, pos + 1 + match.to, {
          class: "ref",
          "data-entity-id": match.entity.id,
          "data-entity-type": match.entity.type,
        })
      );
    }
    return false;
  });

  return DecorationSet.create(doc, decorations);
}

export const EntityReference = Extension.create<
  EntityReferenceOptions,
  EntityReferenceStorage
>({
  name: "entityReference",

  addOptions() {
    return {
      entityIndex: [],
    };
  },

  addStorage() {
    return {
      entityIndex: this.options.entityIndex,
    };
  },

  addCommands() {
    return {
      updateEntityIndex:
        (newIndex) =>
        ({ tr, dispatch }) => {
          this.storage.entityIndex = newIndex;
          if (dispatch) {
            // Meta flag → plugin rebuild DecorationSet walau doc tidak berubah.
            dispatch(tr.setMeta(entityReferenceKey, true));
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const getIndex = () => this.storage.entityIndex;

    return [
      new Plugin<DecorationSet>({
        key: entityReferenceKey,
        state: {
          init: (_config, state) => buildDecorations(state.doc, getIndex()),
          apply: (tr, decorations) => {
            // Hitung ulang cuma kalau doc berubah atau index di-refresh —
            // selection/keystroke tanpa perubahan isi tidak scan ulang.
            if (tr.docChanged || tr.getMeta(entityReferenceKey)) {
              return buildDecorations(tr.doc, getIndex());
            }
            return decorations.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
