'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit }                from '@tiptap/starter-kit'
import { Underline  }                from '@tiptap/extension-underline'
import { Link       }                from '@tiptap/extension-link'
import { Image      }                from '@tiptap/extension-image'
import { Placeholder}                 from '@tiptap/extension-placeholder'
import { CharacterCount}               from '@tiptap/extension-character-count'
import { Table        }                 from '@tiptap/extension-table'
import { TableRow     }                 from '@tiptap/extension-table-row'
import { TableCell    }                 from '@tiptap/extension-table-cell'
import { TableHeader   }                from '@tiptap/extension-table-header'
import { TaskList      }                from '@tiptap/extension-task-list'
import { TaskItem      }                from '@tiptap/extension-task-item'
import { TextStyle     }                from '@tiptap/extension-text-style'

import { Scripture }       from './extensions/scripture'
import { FontSize }        from './extensions/font-size'
import { LineHeight }      from './extensions/line-height'
import { EditorToolbar }   from './EditorToolbar'

import './editor.css'

interface RichEditorProps {
  initialHtml?: string
  onChange:    (html: string) => void
  placeholder?: string
}

/**
 * Word count from HTML — strips tags, counts whitespace-separated words.
 */
function countWords(html: string): number {
  if (!html) return 0
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim()
  if (!text) return 0
  return text.split(/\s+/).length
}

export default function RichEditor({
  initialHtml,
  onChange,
  placeholder = 'Start writing… type / for blocks',
}: RichEditorProps) {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: 'language-text' } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      FontSize,
      LineHeight,
      Scripture,
    ],
    content: initialHtml ?? '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'lr-editor-content',
      },
    },
    immediatelyRender: false,
  })

  if (!editor) {
    return (
      <div className="lr-editor" style={{ minHeight: '320px' }}>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          Loading editor…
        </div>
      </div>
    )
  }

  const charCount = editor.storage.characterCount.characters() as number
  const html      = editor.getHTML()
  const wordCount = countWords(html)
  const readMin   = Math.max(1, Math.ceil(wordCount / 220))

  return (
    <div className="lr-editor">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="lr-editor-footer">
        <span>{wordCount} words · {charCount} characters</span>
        <span>~{readMin} min read</span>
      </div>
    </div>
  )
}
