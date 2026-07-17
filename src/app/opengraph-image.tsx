import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'flex-start',
          justifyContent: 'flex-end',
          background:     '#0f1012',
          padding:        '72px 80px',
          position:       'relative',
          fontFamily:     'sans-serif',
        }}
      >
        {/* Gold top bar */}
        <div style={{
          position:   'absolute',
          top:        0,
          left:       0,
          right:      0,
          height:     '7px',
          background: 'linear-gradient(90deg, #F5AE41 0%, #C32126 100%)',
          display:    'flex',
        }} />

        {/* Background pattern — subtle diagonal stripes */}
        <div style={{
          position:   'absolute',
          inset:      0,
          background: 'radial-gradient(ellipse at 80% 50%, rgba(245,174,65,0.07) 0%, transparent 60%)',
          display:    'flex',
        }} />

        {/* Eyebrow */}
        <div style={{
          display:       'flex',
          fontSize:      '18px',
          fontWeight:    700,
          letterSpacing: '0.25em',
          color:         '#F5AE41',
          marginBottom:  '20px',
        }}>
          LOVESEAL CHURCH
        </div>

        {/* Main title — two lines */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          fontSize:      '108px',
          fontWeight:    900,
          lineHeight:    0.88,
          color:         '#e8e4dc',
          letterSpacing: '-0.03em',
          marginBottom:  '36px',
        }}>
          <span style={{ display: 'flex' }}>LIVELY</span>
          <span style={{ display: 'flex', color: '#F5AE41' }}>RESOURCES</span>
        </div>

        {/* Description */}
        <div style={{
          display:    'flex',
          fontSize:   '26px',
          color:      '#7a7060',
          lineHeight: 1.45,
          maxWidth:   '680px',
        }}>
          Manuals, Prophecies, Articles &amp; Blog from LoveSeal Church
        </div>

        {/* Bottom-right domain tag */}
        <div style={{
          position:      'absolute',
          bottom:        '72px',
          right:         '80px',
          display:       'flex',
          alignItems:    'center',
          gap:           '12px',
        }}>
          <div style={{
            width:      '36px',
            height:     '2px',
            background: '#C32126',
            display:    'flex',
          }} />
          <div style={{
            fontSize:      '15px',
            fontWeight:    600,
            letterSpacing: '0.08em',
            color:         '#4a4440',
          }}>
            resources.lovesealchurch.org
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
