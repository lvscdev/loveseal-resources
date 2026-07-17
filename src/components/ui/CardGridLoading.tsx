import Skeleton from '@/components/ui/Skeleton'

/**
 * Skeleton fallback for any topic / topics / authors index page or
 * single-topic landing. All four routes render the same conceptual shape:
 * a heading + a grid of cards. Configurable via `cardCount` (defaults to
 * a sensible 12 for index pages, but consumers can adjust if their hero
 * card area is taller).
 */
export default function CardGridLoading({
  cardCount   = 12,
  showHeader  = true,
}: {
  cardCount?:  number
  showHeader?: boolean
}) {
  return (
    <div
      style={{
        maxWidth: '90rem',
        margin:   '0 auto',
        padding:  '3.5rem 1.5rem 5rem',
      }}
    >
      {showHeader && (
        <>
          {/* Heading row */}
          <div
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '0.75rem',
              marginBottom:   '1.5rem',
              paddingBottom:  '1rem',
              borderBottom:   '0.0625rem solid var(--border-subtle)',
            }}
          >
            <Skeleton width="0.5rem" height="0.5rem" borderRadius="0" />
            <Skeleton width="14rem" height="2.5rem" />
          </div>
          {/* Subtitle / description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="1rem" width="40%" />
          </div>
        </>
      )}

      {/* Card grid */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(16.25rem, 1fr))',
          gap:                 '1.25rem',
        }}
      >
        {Array.from({ length: cardCount }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.75rem',
      }}
    >
      <Skeleton height="11rem" borderRadius="0.75rem" />
      <Skeleton height="0.75rem" width="40%" />
      <Skeleton height="1.25rem" />
      <Skeleton height="1.25rem" width="75%" />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <Skeleton width="5rem" height="0.75rem" />
        <Skeleton width="3rem" height="0.75rem" />
      </div>
    </div>
  )
}