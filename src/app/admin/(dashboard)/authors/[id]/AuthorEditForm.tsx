'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { createAuthor, updateAuthor } from './../actions'
import { slugifyAuthorName } from '@/lib/slugify'
import InitialsAvatar from '@/components/reader/InitialsAvatar'
import ButtonSpinner from '@/components/ui/ButtonSpinner'
import { toast } from '@/lib/toast'

interface InitialAuthor {
  id:         string
  name:       string
  slug:       string
  bio:        string
  avatar_url: string | null
}

interface AuthorEditFormProps {
  initial: InitialAuthor
  isNew:   boolean
}

export default function AuthorEditForm({ initial, isNew }: AuthorEditFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [name, setName]             = useState(initial.name)
  const [bio,  setBio]              = useState(initial.bio)
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(initial.avatar_url)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [saving,    setSaving]      = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Live slug preview — same algorithm the server uses on save. The actual
     slug stored may differ if uniquification kicks in. */
  const slugPreview = slugifyAuthorName(name) || initial.slug

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Invalid avatar format', {
        description: 'Avatar must be JPG, PNG or WebP.',
      })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar too large', {
        description: 'File must be under 2 MB.',
      })
      return
    }

    setAvatarBusy(true)
    const toastId = toast.loading('Uploading avatar…')

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      /* Use a stable per-author directory so subsequent re-uploads overwrite
         the old file. Author ID is the natural key; for "new" authors we
         haven't got one yet, so we generate a UUID stand-in. The path is
         only ever referenced via the public URL stored on authors.avatar_url,
         so the only requirement is uniqueness across the bucket. */
      const ownerKey = initial.id || crypto.randomUUID()
      const path     = `${ownerKey}/avatar-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('author-avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadErr) {
        toast.error('Avatar upload failed', {
          id: toastId,
          description: uploadErr.message,
        })
        setAvatarBusy(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('author-avatars')
        .getPublicUrl(path)

      setAvatarUrl(publicUrl)
      toast.success('Avatar uploaded', {
        id: toastId,
        description: 'Save the form to apply.',
      })
    } catch (err) {
      toast.error('Avatar upload failed', {
        id: toastId,
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setAvatarBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function onRemoveAvatar() {
    setAvatarUrl(null)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const toastId = toast.loading(isNew ? 'Creating author…' : 'Saving changes…')

    startTransition(async () => {
      try {
        if (isNew) {
          const result = await createAuthor(name, bio)
          if (!result.ok) {
            toast.error('Save failed', {
              id: toastId,
              description: result.error ?? 'Please try again.',
            })
            setSaving(false)
            return
          }
          /* If an avatar was uploaded before the author row existed, the
             upload used a random ownerKey path. Persist it now via update. */
          if (avatarUrl && result.authorId) {
            const upd = await updateAuthor(result.authorId, {
              name, bio: bio || null, avatar_url: avatarUrl,
            })
            if (!upd.ok) {
              toast.error('Avatar save failed', {
                id: toastId,
                description: upd.error ?? 'Author created, but avatar could not be linked.',
              })
              setSaving(false)
              return
            }
          }
          toast.success('Author created', {
            id: toastId,
            description: `"${name}" is ready to be assigned to content.`,
          })
          router.push('/admin/authors')
          router.refresh()
        } else {
          const result = await updateAuthor(initial.id, {
            name, bio: bio || null, avatar_url: avatarUrl,
          })
          if (!result.ok) {
            toast.error('Save failed', {
              id: toastId,
              description: result.error ?? 'Please try again.',
            })
            setSaving(false)
            return
          }
          toast.success('Author saved', {
            id: toastId,
            description: `Changes to "${name}" applied.`,
          })
          router.push('/admin/authors')
          router.refresh()
        }
      } catch (err) {
        toast.error('Save failed', {
          id: toastId,
          description: err instanceof Error ? err.message : 'Please try again.',
        })
        setSaving(false)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: '46rem' }}>

      {/* Avatar */}
      <div style={cardStyle}>
        <SectionHeader label="AVATAR" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {avatarUrl ? (
            <div style={{
              width:        '6rem',
              height:       '6rem',
              borderRadius: '50%',
              overflow:     'hidden',
              background:   'var(--bg-elevated)',
              flexShrink:   0,
            }}>
              <Image
                src={avatarUrl}
                alt=""
                width={96}
                height={96}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <InitialsAvatar name={name || '?'} size={6} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onAvatarChange}
              disabled={avatarBusy}
              style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-body)' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              JPG, PNG or WebP. Up to 2 MB.
            </div>
            {avatarUrl && (
              <button
                type="button"
                onClick={onRemoveAvatar}
                disabled={avatarBusy}
                style={{
                  alignSelf:   'flex-start',
                  fontSize:    '0.75rem',
                  color:       'var(--text-tertiary)',
                  background:  'transparent',
                  border:      '0.03125rem solid var(--border-subtle)',
                  padding:     '0.3125rem 0.5625rem',
                  borderRadius: '0.375rem',
                  cursor:      'pointer',
                  fontFamily:  'var(--font-body)',
                }}
              >
                Remove avatar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div style={cardStyle}>
        <SectionHeader label="IDENTITY" />
        <Field label="Name">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Pastor Ada Mensah"
            style={inputStyle}
            required
          />
        </Field>
        <Field
          label="Slug"
          hint={`URL: /authors/${slugPreview || '…'}`}
        >
          <input
            type="text"
            value={slugPreview}
            disabled
            style={{ ...inputStyle, color: 'var(--text-tertiary)', background: 'var(--bg-elevated)' }}
          />
        </Field>
      </div>

      {/* Bio */}
      <div style={cardStyle}>
        <SectionHeader label="BIO" />
        <Field label="Short bio" hint="Optional. Shown on the author profile page.">
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={5}
            placeholder="One paragraph. Their role, focus, or how readers know them."
            style={{ ...inputStyle, minHeight: '6rem', resize: 'vertical', lineHeight: 1.5 }}
          />
        </Field>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
        <button
          type="submit"
          disabled={saving || avatarBusy}
          style={{
            padding:        '0.5625rem 1.125rem',
            background:     'var(--brand-gold)',
            color:          'var(--text-inverse)',
            border:         'none',
            borderRadius:   '0.4375rem',
            fontSize:       '0.8125rem',
            fontWeight:     500,
            cursor:         saving ? 'wait' : 'pointer',
            fontFamily:     'var(--font-body)',
            display:        'inline-flex',
            alignItems:     'center',
            justifyContent: 'center',
            minHeight:      '2.375rem',
            minWidth:       '8.75rem',
          }}
        >
          {saving
            ? <ButtonSpinner label={isNew ? 'Creating…' : 'Saving…'} inverse />
            : (isNew ? 'Create author' : 'Save changes')}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/authors')}
          disabled={saving}
          style={{
            padding:      '0.5625rem 1rem',
            background:   'transparent',
            color:        'var(--text-secondary)',
            border:       '0.03125rem solid var(--border-subtle)',
            borderRadius: '0.4375rem',
            fontSize:     '0.8125rem',
            cursor:       'pointer',
            fontFamily:   'var(--font-body)',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

/* ── Local sub-components & styles — mirror the EditForm patterns so the
   admin shell feels consistent. ── */

const cardStyle: React.CSSProperties = {
  background:   'var(--bg-raised)',
  border:       '0.03125rem solid var(--border-subtle)',
  borderRadius: '0.5rem',
  padding:      '1.125rem',
  marginBottom: '1rem',
}

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '0.5rem 0.6875rem',
  fontSize:     '0.875rem',
  fontFamily:   'var(--font-body)',
  background:   'var(--bg-base)',
  border:       '0.03125rem solid var(--border-subtle)',
  borderRadius: '0.375rem',
  color:        'var(--text-primary)',
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      fontSize:      '0.6875rem',
      fontWeight:    600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color:         'var(--text-muted)',
      marginBottom:  '0.875rem',
    }}>
      {label}
    </div>
  )
}

function Field({ label, hint, children }: {
  label:    string
  hint?:    string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={{
        display:      'block',
        fontSize:     '0.75rem',
        fontWeight:   500,
        color:        'var(--text-secondary)',
        marginBottom: '0.3125rem',
        fontFamily:   'var(--font-body)',
      }}>
        {label}
      </label>
      {children}
      {hint && (
        <div style={{
          marginTop:  '0.25rem',
          fontSize:   '0.6875rem',
          color:      'var(--text-tertiary)',
          fontFamily: 'var(--font-body)',
        }}>
          {hint}
        </div>
      )}
    </div>
  )
}