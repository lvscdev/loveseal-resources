import { Extension } from '@tiptap/core'

export interface FontSizeOptions {
  types: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      /** Set the font size (e.g. "18px") on the current selection. */
      setFontSize: (size: string) => ReturnType
      /** Clear the font size override, falling back to the theme default. */
      unsetFontSize: () => ReturnType
    }
  }
}

/**
 * Adds a `fontSize` attribute to the `textStyle` mark, rendered as an inline
 * `font-size` style — same pattern Tiptap docs use for custom mark attributes
 * on top of `@tiptap/extension-text-style`.
 */
export const FontSize = Extension.create<FontSizeOptions>({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: size }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    }
  },
})
