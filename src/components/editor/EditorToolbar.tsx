'use client'

import { type Editor } from '@tiptap/react'
import { useRef, useState } from 'react'
import { uploadEditorImage } from './upload-image'
import { toast } from '@/lib/toast'
import PromptModal from '@/components/ui/PromptModal'

export function EditorToolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [linkPromptOpen, setLinkPromptOpen] = useState(false)
  const [scripturePromptOpen, setScripturePromptOpen] = useState(false)

  if (!editor) return null

  function handleLink() {
    setLinkPromptOpen(true)
  }

  function submitLink(values: Record<string, string>) {
    setLinkPromptOpen(false)
    const url = values.url.trim()
    if (!url) {                                           // cleared
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  function handleScripture() {
    setScripturePromptOpen(true)
  }

  function submitScripture(values: Record<string, string>) {
    setScripturePromptOpen(false)
    editor.chain().focus().setScripture({
      reference: values.reference.trim(),
      text: (values.text ?? '').trim(),
    }).run()
  }

  async function handleImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''                                   // reset so same file can be picked again

    try {
      const url = await uploadEditorImage(file)
      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed')
    }
  }

  function handleTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="lr-editor-toolbar">

      {/* Headings */}
      <ToolbarBtn
        title="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <strong style={{ fontSize: '11px' }}>H1</strong>
      </ToolbarBtn>
      <ToolbarBtn
        title="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <strong style={{ fontSize: '11px' }}>H2</strong>
      </ToolbarBtn>
      <ToolbarBtn
        title="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <strong style={{ fontSize: '11px' }}>H3</strong>
      </ToolbarBtn>

      <Divider />

      {/* Typography */}
      <FontSizeSelect editor={editor} />
      <LineHeightSelect editor={editor} />

      <Divider />

      {/* Marks */}
      <ToolbarBtn
        title="Bold (⌘B)"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong style={{ fontWeight: 700 }}>B</strong>
      </ToolbarBtn>
      <ToolbarBtn
        title="Italic (⌘I)"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarBtn>
      <ToolbarBtn
        title="Underline (⌘U)"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span style={{ textDecoration: 'underline' }}>U</span>
      </ToolbarBtn>
      <ToolbarBtn
        title="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <span style={{ textDecoration: 'line-through' }}>S</span>
      </ToolbarBtn>
      <ToolbarBtn
        title="Inline code"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {'<>'}
      </ToolbarBtn>

      <Divider />

      {/* Lists */}
      <ToolbarBtn
        title="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        ≡
      </ToolbarBtn>
      <ToolbarBtn
        title="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <span style={{ fontSize: '10px', fontWeight: 600 }}>1.</span>
      </ToolbarBtn>
      <ToolbarBtn
        title="Task list"
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        ☐
      </ToolbarBtn>

      <Divider />

      {/* Blocks */}
      <ToolbarBtn
        title="Blockquote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❝
      </ToolbarBtn>
      <ToolbarBtn
        title="Code block"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>{'{}'}</span>
      </ToolbarBtn>
      <ToolbarBtn
        title="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        —
      </ToolbarBtn>
      <ToolbarBtn
        title="Insert table"
        onClick={handleTable}
      >
        ⊞
      </ToolbarBtn>

      <Divider />

      {/* Inserts */}
      <ToolbarBtn
        title="Insert link"
        active={editor.isActive('link')}
        onClick={handleLink}
      >
        🔗
      </ToolbarBtn>
      <ToolbarBtn
        title="Insert image"
        onClick={() => fileRef.current?.click()}
      >
        🖼
      </ToolbarBtn>
      <ToolbarBtn
        title="Insert scripture"
        active={editor.isActive('scripture')}
        onClick={handleScripture}
      >
        ✝
      </ToolbarBtn>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleImageInput}
        style={{ display: 'none' }}
      />

      <PromptModal
        open={linkPromptOpen}
        title="Insert link"
        fields={[{ name: 'url', label: 'Link URL', placeholder: 'https://…' }]}
        initialValues={{ url: editor.getAttributes('link').href ?? '' }}
        submitLabel="Insert"
        onSubmit={submitLink}
        onCancel={() => setLinkPromptOpen(false)}
      />

      <PromptModal
        open={scripturePromptOpen}
        title="Insert scripture"
        fields={[
          { name: 'reference', label: 'Scripture reference', placeholder: 'e.g. Matthew 16:24', required: true },
          { name: 'text', label: 'Scripture text (optional)', placeholder: 'Paste the verse here', multiline: true },
        ]}
        submitLabel="Insert"
        onSubmit={submitScripture}
        onCancel={() => setScripturePromptOpen(false)}
      />

      <Divider />

      {/* Undo / redo */}
      <ToolbarBtn
        title="Undo (⌘Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        ↶
      </ToolbarBtn>
      <ToolbarBtn
        title="Redo (⌘⇧Z)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        ↷
      </ToolbarBtn>
    </div>
  )
}

function ToolbarBtn({
  children, title, active, disabled, onClick,
}: {
  children: React.ReactNode
  title: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={active ? 'is-active' : undefined}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="toolbar-divider" />
}

const FONT_SIZES = ['12px', '13px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']
const LINE_HEIGHTS = ['1', '1.15', '1.5', '1.75', '2', '2.5']

function FontSizeSelect({ editor }: { editor: Editor }) {
  const value = (editor.getAttributes('textStyle').fontSize as string | undefined) ?? ''

  return (
    <select
      title="Font size"
      value={value}
      onChange={(e) => {
        const size = e.target.value
        if (size) editor.chain().focus().setFontSize(size).run()
        else editor.chain().focus().unsetFontSize().run()
      }}
    >
      <option value="">Size</option>
      {FONT_SIZES.map(size => (
        <option key={size} value={size}>{parseInt(size, 10)}</option>
      ))}
    </select>
  )
}

function LineHeightSelect({ editor }: { editor: Editor }) {
  const value = (editor.getAttributes('paragraph').lineHeight
    ?? editor.getAttributes('heading').lineHeight
    ?? '') as string

  return (
    <select
      title="Line spacing"
      value={value}
      onChange={(e) => {
        const height = e.target.value
        if (height) editor.chain().focus().setLineHeight(height).run()
        else editor.chain().focus().unsetLineHeight().run()
      }}
    >
      <option value="">Spacing</option>
      {LINE_HEIGHTS.map(height => (
        <option key={height} value={height}>{height}</option>
      ))}
    </select>
  )
}
