'use client'

import { useState, useRef } from 'react'

const TYPE_COLORS: Record<string, string> = {
  manual:   '#4498CC',
  prophecy: '#C32126',
  article:  '#F5AE41',
  blog:     '#8B5CF6',
}

const LISTEN_LABEL: Record<string, string> = {
  manual:   'Listen to this Teaching',
  prophecy: 'Listen to this Prophecy',
  article:  'Listen to this Article',
  blog:     'Listen to this Message',
}

const WATCH_LABEL: Record<string, string> = {
  manual:   'Watch this Teaching',
  prophecy: 'Watch this Prophecy',
  article:  'Watch this Article',
  blog:     'Watch this Message',
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return '--:--'
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/* ── Audio player ─────────────────────────────────────────────────────── */
function AudioPlayer({
  url,
  label,
  accent,
}: {
  url:    string
  label:  string
  accent: string
}) {
  const audioRef                  = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying]     = useState(false)
  const [current, setCurrent]     = useState(0)
  const [duration, setDuration]   = useState(0)
  const [buffering, setBuffering] = useState(false)

  function toggle() {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      el.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = val
    setCurrent(val)
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div style={{
      background:    'var(--bg-raised)',
      border:        `0.5px solid var(--border-subtle)`,
      borderRadius:  '0.875rem',
      overflow:      'hidden',
    }}>
      {/* Accent bar */}
      <div style={{ height: '3px', background: accent, borderRadius: '0.875rem 0.875rem 0 0' }} />

      {/* Label row */}
      <div style={{
        padding:       '0.75rem 1.25rem 0.625rem',
        display:       'flex',
        alignItems:    'center',
        gap:           '0.5rem',
        borderBottom:  '0.5px solid var(--border-subtle)',
      }}>
        <HeadphonesIcon color={accent} />
        <span style={{
          fontSize:      '0.625rem',
          fontWeight:    700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color:         accent,
        }}>
          {label}
        </span>
      </div>

      {/* Controls */}
      <div style={{
        padding:    '1rem 1.25rem',
        display:    'flex',
        alignItems: 'center',
        gap:        '1rem',
      }}>
        {/* Play / Pause */}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{
            flexShrink:      0,
            width:           '2.75rem',
            height:          '2.75rem',
            borderRadius:    '50%',
            border:          'none',
            background:      accent,
            color:           '#fff',
            cursor:          'pointer',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            transition:      'opacity 0.12s',
            opacity:         buffering ? 0.6 : 1,
          }}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Scrubber + time */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {/* Track */}
          <div style={{ position: 'relative', height: '4px', borderRadius: '99px', background: 'var(--bg-elevated)', cursor: 'pointer' }}>
            {/* Filled portion */}
            <div style={{
              position:     'absolute',
              left:         0,
              top:          0,
              bottom:       0,
              width:        `${progress}%`,
              background:   accent,
              borderRadius: '99px',
              transition:   'width 0.1s linear',
            }} />
            {/* Native range input (transparent, over the bar) */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={current}
              onChange={seek}
              aria-label="Seek"
              style={{
                position:   'absolute',
                inset:      '-6px 0',
                width:      '100%',
                opacity:    0,
                cursor:     'pointer',
                margin:     0,
              }}
            />
          </div>
          {/* Times */}
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            fontSize:       '0.625rem',
            color:          'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Download */}
        <a
          href={url}
          download
          title="Download audio"
          aria-label="Download audio"
          style={{
            flexShrink:     0,
            width:          '2.25rem',
            height:         '2.25rem',
            borderRadius:   '50%',
            border:         '0.5px solid var(--border-strong)',
            color:          'var(--text-secondary)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            textDecoration: 'none',
            transition:     'background 0.12s, color 0.12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = accent
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <DownloadIcon />
        </a>
      </div>

      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
      />
    </div>
  )
}

/* ── YouTube embed ───────────────────────────────────────────────────── */
function YouTubeEmbed({
  videoId,
  label,
  accent,
}: {
  videoId: string
  label:   string
  accent:  string
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div style={{
      background:   'var(--bg-raised)',
      border:       '0.5px solid var(--border-subtle)',
      borderRadius: '0.875rem',
      overflow:     'hidden',
    }}>
      {/* Accent bar */}
      <div style={{ height: '3px', background: accent, borderRadius: '0.875rem 0.875rem 0 0' }} />

      {/* Label row */}
      <div style={{
        padding:      '0.75rem 1.25rem 0.625rem',
        display:      'flex',
        alignItems:   'center',
        gap:          '0.5rem',
        borderBottom: '0.5px solid var(--border-subtle)',
      }}>
        <YouTubeIcon color={accent} />
        <span style={{
          fontSize:      '0.625rem',
          fontWeight:    700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color:         accent,
        }}>
          {label}
        </span>
      </div>

      {/* 16:9 embed area */}
      <div style={{ position: 'relative', paddingTop: '56.25%' }}>
        {revealed ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            title={label}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            aria-label="Play video"
            style={{
              position:        'absolute',
              inset:           0,
              width:           '100%',
              height:          '100%',
              padding:         0,
              border:          'none',
              background:      '#000',
              cursor:          'pointer',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
            }}
          >
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              style={{
                position:   'absolute',
                inset:      0,
                width:      '100%',
                height:     '100%',
                objectFit:  'cover',
                opacity:    0.72,
              }}
            />
            {/* Play button pill */}
            <div style={{
              position:        'relative',
              zIndex:          1,
              width:           '4.5rem',
              height:          '3rem',
              background:      '#FF0000',
              borderRadius:    '0.75rem',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              boxShadow:       '0 4px 20px rgba(0,0,0,0.5)',
              transition:      'transform 0.15s',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Open on YouTube link */}
      <div style={{ padding: '0.625rem 1.25rem' }}>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize:       '0.6875rem',
            color:          'var(--text-muted)',
            textDecoration: 'none',
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '0.25rem',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          Open in YouTube
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>
  )
}

/* ── Public export ───────────────────────────────────────────────────── */
export default function MediaSection({
  audioUrl,
  videoUrl,
  contentType,
}: {
  audioUrl:    string | null | undefined
  videoUrl:    string | null | undefined
  contentType: string
}) {
  if (!audioUrl && !videoUrl) return null

  const accent   = TYPE_COLORS[contentType] ?? '#F5AE41'
  const listenLabel = LISTEN_LABEL[contentType] ?? 'Listen to this Message'
  const watchLabel  = WATCH_LABEL[contentType]  ?? 'Watch this Message'
  const videoId  = videoUrl ? extractYouTubeId(videoUrl) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', margin: '1.75rem 0 2.25rem' }}>
      {audioUrl && (
        <AudioPlayer url={audioUrl} label={listenLabel} accent={accent} />
      )}
      {videoId && (
        <YouTubeEmbed videoId={videoId} label={watchLabel} accent={accent} />
      )}
    </div>
  )
}

/* ── Icons ───────────────────────────────────────────────────────────── */
function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}
function HeadphonesIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    </svg>
  )
}
function YouTubeIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.24 5 12 5 12 5s-6.24 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.76 19 12 19 12 19s6.24 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3-5.2 3z"/>
    </svg>
  )
}
