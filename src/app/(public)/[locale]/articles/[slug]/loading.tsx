import Skeleton from '@/components/ui/Skeleton'

/**
 * Skeleton fallback for the content reader page (`/content/[id]`).
 *
 * Mimics the rendered layout's shape so when the real content arrives
 * there's no layout shift: breadcrumb (top), tall title block, byline card,
 * summary points, then a stack of paragraph lines representing the body.
 *
 * The dimensions track what ContentReader actually renders — keep them in
 * sync if the reader layout changes substantially.
 */
export default function ContentReaderLoading() {
  return (
    <article
      style={{
        maxWidth: '46rem',
        margin:   '0 auto',
        padding:  '2.5rem 1.25rem 4rem',
      }}
    >
      {/* Breadcrumb row */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <Skeleton width="3rem"  height="0.75rem" />
        <Skeleton width="0.5rem" height="0.75rem" />
        <Skeleton width="4rem"  height="0.75rem" />
        <Skeleton width="0.5rem" height="0.75rem" />
        <Skeleton width="6rem"  height="0.75rem" />
      </div>

      {/* Eyebrow */}
      <Skeleton width="8rem" height="0.75rem" style={{ marginBottom: '1rem' }} />

      {/* Title (3 stacked lines, shrinking) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        <Skeleton height="2.5rem" />
        <Skeleton width="85%" height="2.5rem" />
        <Skeleton width="60%" height="2.5rem" />
      </div>

      {/* Byline row — avatar + name + meta */}
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '0.75rem',
          marginBottom: '3rem',
          paddingBottom:'1.5rem',
          borderBottom: '0.0625rem solid var(--border-subtle)',
        }}
      >
        <Skeleton width="2.5rem" height="2.5rem" borderRadius="50%" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <Skeleton width="8rem" height="0.875rem" />
          <Skeleton width="12rem" height="0.75rem" />
        </div>
      </div>

      {/* Summary points block */}
      <div
        style={{
          padding:      '1.5rem',
          background:   'var(--bg-raised)',
          borderRadius: '0.75rem',
          marginBottom: '3rem',
          display:      'flex',
          flexDirection:'column',
          gap:          '0.75rem',
        }}
      >
        <Skeleton width="6rem" height="0.75rem" />
        <Skeleton height="1rem" />
        <Skeleton width="95%" height="1rem" />
        <Skeleton width="80%" height="1rem" />
      </div>

      {/* Body paragraph lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton
            key={i}
            height="1rem"
            width={i % 5 === 4 ? '60%' : '100%'}
          />
        ))}
      </div>
    </article>
  )
}