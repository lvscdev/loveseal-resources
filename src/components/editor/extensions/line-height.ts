import { Extension } from '@tiptap/core'

export interface LineHeightOptions {
  types: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      /** Set line spacing (e.g. "1.5") on every block node touched by the selection. */
      setLineHeight: (height: string) => ReturnType
      /** Clear the line spacing override, falling back to the theme default. */
      unsetLineHeight: () => ReturnType
    }
  }
}

/**
 * Line spacing is a block-level style (unlike font size, which is a mark),
 * so it's stored as a node attribute rendered as an inline `line-height`
 * style on every paragraph/heading node the selection touches.
 */
export const LineHeight = Extension.create<LineHeightOptions>({
  name: 'lineHeight',

  addOptions() {
    return { types: ['paragraph', 'heading'] }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes => {
              if (!attributes.lineHeight) return {}
              return { style: `line-height: ${attributes.lineHeight}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight: (height: string) => ({ tr, state, dispatch }) => {
        const { from, to } = state.selection
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight: height })
          }
        })
        if (dispatch) dispatch(tr)
        return true
      },
      unsetLineHeight: () => ({ tr, state, dispatch }) => {
        const { from, to } = state.selection
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight: null })
          }
        })
        if (dispatch) dispatch(tr)
        return true
      },
    }
  },
})
