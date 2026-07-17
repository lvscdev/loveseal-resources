'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteAuthor } from './actions'
import InitialsAvatar from '@/components/reader/InitialsAvatar'
import ButtonSpinner from '@/components/ui/ButtonSpinner'
import { toast } from '@/lib/toast'

interface AuthorRow {
  id:            string
  name:          string
  slug:          string
  bio:           string | null
  avatar_url:    string | null
  created_at:    string
  content_count: number
}

export default function AuthorsList({ authors }: { authors: AuthorRow[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busyId,    setBusyId]    = useState<string | null>(null)

  function onDelete(id: string, name: string) {
    setBusyId(id)
    startTransition(async () => {
      const result = await deleteAuthor(id)
      setBusyId(null)
      if (!result.ok) {
        toast.error('Delete failed', {
          description: result.error ?? 'Please try again.',
        })
        return
      }
      toast.success('Author deleted', {
        description: `"${name}" has been removed.`,
      })
      setConfirmId(null)
      router.refresh()
    })
  }

  if (authors.length === 0) {
    return (
      <div style={{
        padding:      '2.5rem 1rem',
        textAlign:    'center',
        background:   'var(--bg-raised)',
        border:       '0.03125rem solid var(--border-subtle)',
        borderRadius: '0.5rem',
        color:        'var(--text-tertiary)',
        fontSize:     '0.875rem',
      }}>
        No authors yet. Create one to get started.
      </div>
    )
  }

  return (
    <div>
      <div style={{
        background:   'var(--bg-raised)',
        border:       '0.03125rem solid var(--border-subtle)',
        borderRadius: '0.5rem',
        overflow:     'hidden',
      }}>
        {authors.map((author, idx) => {
          const isLast = idx === authors.length - 1
          const isBusy = busyId === author.id
          return (
            <div
              key={author.id}
              style={{
                display:    'grid',
                gridTemplateColumns: 'auto 1fr auto auto',
                gap:        '0.875rem',
                alignItems: 'center',
                padding:    '0.875rem 1rem',
                borderBottom: isLast ? 'none' : '0.03125rem solid var(--border-subtle)',
              }}
            >
              <InitialsAvatar
                name={author.name}
                avatarUrl={author.avatar_url}
                size={2.5}
              />

              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize:      '0.875rem',
                  fontWeight:    500,
                  color:         'var(--text-primary)',
                  fontFamily:    'var(--font-body)',
                  overflow:      'hidden',
                  textOverflow:  'ellipsis',
                  whiteSpace:    'nowrap',
                }}>
                  {author.name}
                </div>
                <div style={{
                  fontSize:   '0.75rem',
                  color:      'var(--text-tertiary)',
                  marginTop:  '0.125rem',
                  fontFamily: 'var(--font-body)',
                }}>
                  /{author.slug} · {author.content_count} {author.content_count === 1 ? 'item' : 'items'}
                </div>
              </div>

              <Link
                href={`/admin/authors/${author.id}`}
                style={{
                  fontSize:       '0.8125rem',
                  color:          'var(--text-secondary)',
                  textDecoration: 'none',
                  padding:        '0.375rem 0.625rem',
                  borderRadius:   '0.375rem',
                  border:         '0.03125rem solid var(--border-subtle)',
                  fontFamily:     'var(--font-body)',
                }}
              >
                Edit
              </Link>

              {confirmId === author.id ? (
                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onDelete(author.id, author.name)}
                    disabled={isBusy}
                    style={{
                      fontSize:    '0.75rem',
                      color:       '#FFFFFF',
                      background:  'var(--text-danger, #B91C1C)',
                      border:      'none',
                      padding:     '0.375rem 0.625rem',
                      borderRadius: '0.375rem',
                      cursor:      isBusy ? 'wait' : 'pointer',
                      fontFamily:  'var(--font-body)',
                      display:     'inline-flex',
                      alignItems:  'center',
                      justifyContent: 'center',
                      minHeight:   '1.75rem',
                      minWidth:    '4.5rem',
                    }}
                  >
                    {isBusy ? <ButtonSpinner label="Deleting…" inverse /> : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    disabled={isBusy}
                    style={{
                      fontSize:    '0.75rem',
                      color:       'var(--text-tertiary)',
                      background:  'transparent',
                      border:      '0.03125rem solid var(--border-subtle)',
                      padding:     '0.375rem 0.625rem',
                      borderRadius: '0.375rem',
                      cursor:      'pointer',
                      fontFamily:  'var(--font-body)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(author.id)}
                  style={{
                    fontSize:    '0.8125rem',
                    color:       'var(--text-tertiary)',
                    background:  'transparent',
                    border:      '0.03125rem solid var(--border-subtle)',
                    padding:     '0.375rem 0.625rem',
                    borderRadius: '0.375rem',
                    cursor:      'pointer',
                    fontFamily:  'var(--font-body)',
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}