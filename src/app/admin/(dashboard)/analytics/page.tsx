import AnalyticsDashboard from './AnalyticsDashboard'

export const metadata = { title: 'Analytics' }

const eyebrowStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '4px',
}

const pageTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
  fontSize: '28px',
  fontWeight: 900,
  textTransform: 'uppercase',
  color: 'var(--text-primary)',
  lineHeight: 1.0,
}

export default function AnalyticsPage() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={eyebrowStyle}>Google Analytics</p>
        <h1 style={pageTitleStyle}>Analytics</h1>
      </div>
      <AnalyticsDashboard />
    </div>
  )
}
