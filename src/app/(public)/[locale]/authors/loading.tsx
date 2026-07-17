import Skeleton from '@/components/ui/Skeleton'
import CardGridLoading from '@/components/ui/CardGridLoading'

/**
 * Author profile skeleton — big header (avatar + name + bio + type
 * filter), then a grid of their content. The header is shaped to match
 * the real AuthorHeader component so there's no layout shift on swap.
 */
export default function AuthorProfileLoading() {
  return (
    <div>
      {/* Header */}
      <div
        style={{
          maxWidth: '70rem',
          margin:   '0 auto',
          padding:  '3.5rem 1.5rem 1rem',
          display:  'flex',
          gap:      '1.5rem',
          alignItems:'center',
        }}
      >
        <Skeleton width="5rem" height="5rem" borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <Skeleton width="40%" height="2.25rem" />
          <Skeleton width="60%" height="1rem" />
          <Skeleton width="50%" height="1rem" />
        </div>
      </div>

      {/* Type filter chips */}
      <div
        style={{
          maxWidth: '70rem',
          margin:   '0 auto',
          padding:  '1rem 1.5rem',
          display:  'flex',
          gap:      '0.625rem',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="5rem" height="2rem" borderRadius="999rem" />
        ))}
      </div>

      {/* Grid */}
      <CardGridLoading cardCount={8} showHeader={false} />
    </div>
  )
}