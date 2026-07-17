import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { body = {} }

  const email  = typeof (body as Record<string, unknown>).email === 'string'
    ? ((body as Record<string, unknown>).email as string).trim().toLowerCase()
    : ''
  const locale = typeof (body as Record<string, unknown>).locale === 'string'
    ? (body as Record<string, unknown>).locale as string
    : 'en'

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Invalid email address' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase as any)
    .from('newsletter_subscribers')
    .upsert({ email, locale }, { onConflict: 'email', ignoreDuplicates: true })

  if (dbErr) {
    console.error('[subscribe] db error:', dbErr.message)
    return NextResponse.json({ ok: false, error: 'Could not save subscription' }, { status: 500 })
  }

  // Send welcome email — silently skip if Resend key isn't configured yet
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey && apiKey !== 'your_resend_api_key') {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from:    'Lively Resources <noreply@lovesealchurch.org>',
      to:      email,
      subject: 'Welcome to Lively Resources',
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1012;font-family:'DM Sans',Arial,sans-serif;color:#e8e4dc">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1012">
    <tr><td align="center" style="padding:48px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr><td style="padding-bottom:32px">
          <span style="display:inline-block;padding:6px 16px;background:rgba(245,174,65,0.12);border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#F5AE41">
            LIVELY RESOURCES
          </span>
        </td></tr>
        <tr><td style="padding-bottom:20px">
          <h1 style="margin:0;font-size:40px;font-weight:900;line-height:1;text-transform:uppercase;color:#F5AE41;letter-spacing:-0.02em">
            You're in.
          </h1>
        </td></tr>
        <tr><td style="padding-bottom:32px">
          <p style="margin:0;font-size:16px;line-height:1.7;color:#b8b0a0">
            Thanks for subscribing to <strong style="color:#e8e4dc">Lively Resources</strong> —
            manuals, prophecies, articles, and blog posts from LoveSeal Church,
            delivered straight to your inbox.
          </p>
        </td></tr>
        <tr><td style="padding-bottom:40px">
          <a href="https://resources.lovesealchurch.org/content"
             style="display:inline-block;padding:14px 28px;background:#F5AE41;color:#1a0f00;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px">
            Browse the library →
          </a>
        </td></tr>
        <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px">
          <p style="margin:0;font-size:12px;color:#5a5248">
            You're receiving this because you subscribed at resources.lovesealchurch.org.
            No spam, ever. Unsubscribe anytime by replying to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch(err => console.warn('[subscribe] welcome email failed:', err.message))
  }

  return NextResponse.json({ ok: true })
}
