'use client'

/**
 * Responsive card grid for topic landing pages.
 *
 * Thin wrapper around <ContentCard /> with a consistent grid layout. Topic
 * pages don't need PublicContentList's full FTS-filter shell — they're
 * already filtered server-side. This component just lays the cards out and
 * shows an empty state when needed.
 *
 * Why a client component if it has no interactivity?
 *   ContentCard itself is `'use client'` (it uses next-intl's useTranslations
 *   + the typed Link). To compose it inside a server component, this wrapper
 *   crosses the boundary cleanly.
 *
 *   If we wanted the grid container itself to render server-side, we could
 *   make TopicGrid a server component and only inline ContentCard at the
 *   leaf — but every card is already a client island anyway, so the savings
 *   are nil. Easier to read with one boundary, not many.
 */

import { useTranslations } from 'next-intl'
import ContentCard from '@/components/public/ContentCard'

interface TopicGridItem {
  id:              string
  slug:            string | null
  title:           string
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  theme:           string | null
  speaker:         string | null
  series:          string | null
  date_preached:   string | null
  cover_image_url: string | null
  published_at:    string
  summary_points:  string[] | null
}

export default function TopicGrid({
  items,
  /** Shown when `items` is empty. Sender supplies the copy so the empty state
   *  can read naturally for each context ("No prophecies yet", "No content
   *  tagged 'prayer' yet", etc.). */
  emptyMessage,
}: {
  items:        TopicGridItem[]
  emptyMessage: string
}) {
  const tFilters = useTranslations('filters')

  if (items.length === 0) {
    return (
      <div style={{
        padding:      '3rem 1rem',
        textAlign:    'center',
        background:   'var(--bg-raised)',
        border:       '0.0625rem solid var(--border-subtle)',
        borderRadius: '0.75rem',
        color:        'var(--text-tertiary)',
        fontSize:     '0.9375rem',
        lineHeight:   1.6,
      }}>
        {emptyMessage || tFilters('noContent')}
      </div>
    )
  }

  return (
    <div
      style={{
        display:             'grid',
        /* Responsive: 1 col mobile, 2 col ~640px+, 3 col ~960px+. The min
           value is a rem-based card minimum so the cards don't get crushed
           on small screens. */
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 17.5rem), 1fr))',
        gap:                 '1.25rem',
      }}
    >
      {items.map(item => (
        <ContentCard key={item.id} item={item} layout="grid" />
      ))}
    </div>
  )
}