/**
 * Typed wrapper around `sonner` with brand presets.
 *
 * Centralises all toast invocations behind a small API so future style
 * changes happen in one place. Also provides the `loadingPromise()` helper
 * which is the canonical pattern for any async server action:
 *
 *   const result = await loadingPromise(
 *     translateContent(id),
 *     {
 *       loading: 'Translating to 5 locales…',
 *       success: r => r.ok ? `Translated to ${r.succeeded?.length} locales`
 *                          : 'Translation failed',
 *       error:   'Translation failed',
 *     },
 *   )
 *
 * The toast updates in place from loading → success/error as the promise
 * settles. No need for separate setState calls or stacked toasts.
 *
 * Re-exports `toast` from sonner directly so consumers can use the raw
 * API if they need it (e.g. `toast.custom`, `toast.dismiss`).
 */

import { toast as sonnerToast, type ExternalToast } from 'sonner'

interface ToastOptions {
  description?: string
  duration?:    number
  id?:          string | number
  action?:      { label: string; onClick: () => void }
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function withOptions(opts: ToastOptions | undefined): ExternalToast {
  if (!opts) return {}
  return {
    description: opts.description,
    duration:    opts.duration,
    id:          opts.id,
    action:      opts.action,
  }
}

/* ── Public API ──────────────────────────────────────────────────────── */

export const toast = {
  /** Default toast — neutral white background, no accent. */
  show(message: string, opts?: ToastOptions) {
    return sonnerToast(message, withOptions(opts))
  },

  /** Success — soft green accent. Use for completed actions. */
  success(message: string, opts?: ToastOptions) {
    return sonnerToast.success(message, withOptions(opts))
  },

  /** Error — brand red accent. Use for failures. Longer default duration
      (7s vs 4.5s) so users have time to read what went wrong. */
  error(message: string, opts?: ToastOptions) {
    return sonnerToast.error(message, {
      duration: 7000,
      ...withOptions(opts),
    })
  },

  /** Info — gold accent. Use for confirmations that aren't successes
      (e.g. "Language switched to English", "Theme set to dark"). */
  info(message: string, opts?: ToastOptions) {
    return sonnerToast.info(message, withOptions(opts))
  },

  /** Warning — amber accent. Use sparingly — partial failures, soft
      validation issues that don't block the action. */
  warning(message: string, opts?: ToastOptions) {
    return sonnerToast.warning(message, withOptions(opts))
  },

  /** Loading — persistent gold spinner toast. Returns the toast id so
      the caller can dismiss it manually, but most consumers should use
      `loadingPromise()` instead which handles the resolve/reject path. */
  loading(message: string, opts?: ToastOptions) {
    return sonnerToast.loading(message, withOptions(opts))
  },

  /** Dismiss a specific toast by id, or all toasts if id is omitted. */
  dismiss(id?: string | number) {
    return sonnerToast.dismiss(id)
  },
} as const

/* ── Promise integration ─────────────────────────────────────────────── */

interface PromiseToastConfig<T> {
  loading: string
  success: string | ((value: T) => string)
  error:   string | ((err: unknown) => string)
  description?: string
}

/**
 * Wraps a promise in a toast that updates in place from loading → success
 * (or error). Returns the original promise so the caller can still await
 * the result and react to it.
 *
 * Example:
 *   const result = await loadingPromise(
 *     savePost(data),
 *     {
 *       loading: 'Saving…',
 *       success: 'Saved',
 *       error:   e => e instanceof Error ? e.message : 'Save failed',
 *     },
 *   )
 *   if (result.ok) router.push('/admin/content')
 */
export function loadingPromise<T>(
  promise: Promise<T>,
  config:  PromiseToastConfig<T>,
): Promise<T> {
  sonnerToast.promise(promise, {
    loading:     config.loading,
    success:     config.success as (value: T) => string,
    error:       config.error as (err: unknown) => string,
    description: config.description,
  })
  return promise
}