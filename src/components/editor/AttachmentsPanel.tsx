'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

export interface PendingAttachment {
  id:           string                                  // temp client-side id
  file:         File                                    // the actual file (uploaded on save)
  file_name:    string
  file_type:    'pdf' | 'image' | 'audio' | 'other'
  mime_type:    string
  size_bytes:   number
  preview_url:  string                                  // local object URL for previews
  stored_url?:  string
  db_id?:       string
}

interface AttachmentsPanelProps {
  attachments: PendingAttachment[]
  onChange:    (next: PendingAttachment[]) => void
}

const ACCEPT = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm',
].join(',')

const MAX_BYTES = 20 * 1024 * 1024  // 20 MB matches the Supabase bucket limit

function fileTypeOf(mime: string): PendingAttachment['file_type'] {
  if (mime === 'application/pdf')   return 'pdf'
  if (mime.startsWith('image/'))    return 'image'
  if (mime.startsWith('audio/'))    return 'audio'
  return 'other'
}

function ext(mime: string): string {
  return mime.split('/')[1]?.split(';')[0] ?? 'bin'
}

function formatSize(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1048576)      return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function AttachmentsPanel({ attachments, onChange }: AttachmentsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function addFiles(files: FileList | File[]) {
    const accepted: PendingAttachment[] = []
    Array.from(files).forEach(file => {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is over 20 MB`)
        return
      }
      accepted.push({
        id:          `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        file_name:   file.name,
        file_type:   fileTypeOf(file.type),
        mime_type:   file.type,
        size_bytes:  file.size,
        preview_url: URL.createObjectURL(file),
      })
    })
    onChange([...attachments, ...accepted])
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = ''
  }

  async function handleRemove(att: PendingAttachment) {
    // If the attachment was already saved to DB + Storage, delete it now
    if (att.db_id && att.stored_url) {
      const supabase = createClient()
      const path = att.stored_url.split('/content-assets/')[1]
      if (path) {
        await supabase.storage.from('content-assets').remove([path])
      }
      await supabase.from('content_attachments').delete().eq('id', att.db_id)
    }
    onChange(attachments.filter(a => a.id !== att.id))
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${isDragging ? 'var(--brand-gold)' : 'var(--border-strong)'}`,
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? 'rgba(245,174,65,0.04)' : 'transparent',
          transition: 'background 0.12s, border-color 0.12s',
        }}
      >
        <div style={{ fontSize: '20px', marginBottom: '6px' }}>📎</div>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Drop files here or click to browse
        </p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
          PDF · Image · Audio · Max 20 MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={handleSelect}
        style={{ display: 'none' }}
      />

      {attachments.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {attachments.map(att => (
            <div
              key={att.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                background: 'var(--bg-elevated)',
                border: '0.5px solid var(--border-subtle)',
                borderRadius: '6px',
              }}
            >
              <FileIcon type={att.file_type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {att.file_name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {att.file_type.toUpperCase()} · {formatSize(att.size_bytes)}
                  {att.db_id && (
                    <span style={{ marginLeft: '6px', color: 'var(--success-fg)' }}>· saved</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(att)}
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'transparent',
                  border: '0.5px solid var(--border-strong)',
                  borderRadius: '5px',
                  color: 'var(--danger-fg)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FileIcon({ type }: { type: PendingAttachment['file_type'] }) {
  const styles: Record<typeof type, { bg: string; emoji: string; color: string }> = {
    pdf:   { bg: 'rgba(195,33,38,0.12)',  emoji: '📕', color: '#C32126' },
    image: { bg: 'rgba(68,152,204,0.12)', emoji: '🖼', color: '#4498CC' },
    audio: { bg: 'rgba(245,174,65,0.12)', emoji: '🎵', color: '#F5AE41' },
    other: { bg: 'var(--bg-raised)',       emoji: '📄', color: 'var(--text-tertiary)' },
  }
  const s = styles[type]
  return (
    <div style={{
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      background: s.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '15px',
      flexShrink: 0,
    }}>
      {s.emoji}
    </div>
  )
}

/* Helpers exported for use by save logic */

export async function uploadAttachments(
  contentId: string,
  attachments: PendingAttachment[],
): Promise<void> {
  const supabase = createClient()
  const toUpload = attachments.filter(a => !a.db_id)        // only new ones

  for (let i = 0; i < toUpload.length; i++) {
    const att  = toUpload[i]
    const path = `attachments/${contentId}/${Date.now()}-${i}.${ext(att.mime_type)}`

    const { error: upErr } = await supabase.storage
      .from('content-assets')
      .upload(path, att.file, { contentType: att.mime_type })

    if (upErr) throw new Error(`Upload failed for ${att.file_name}: ${upErr.message}`)

    const { data: { publicUrl } } = supabase.storage
      .from('content-assets')
      .getPublicUrl(path)

    const { error: insertErr } = await supabase.from('content_attachments').insert({
      content_id:    contentId,
      file_url:      publicUrl,
      file_name:     att.file_name,
      file_type:     att.file_type,
      mime_type:     att.mime_type,
      size_bytes:    att.size_bytes,
      display_order: attachments.indexOf(att),
    } as never)

    if (insertErr) throw new Error(`DB insert failed: ${insertErr.message}`)
  }
}
