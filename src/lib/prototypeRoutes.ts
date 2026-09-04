/** Hash-route helpers - keep GitHub Pages base path (/AI3/) in sync. */

/** Output review - interactive 1040 + schedules on Check return (no source-doc rail). */
export const OUTPUT_REVIEW_PATH = '/check-return?form=1040'

/** @deprecated Prefer `/input-return` - kept for legacy links. */
export const PREPARER_DATA_REVIEW_PATH = '/input-return'

/** @deprecated Prefer OUTPUT_REVIEW_PATH - kept for legacy links. */
export const REVIEWER_DATA_REVIEW_PATH = OUTPUT_REVIEW_PATH

/** Launch point - preparer lands in Phase 2 with AI diagnostics panel open (demo bypass). */
export const PREPARER_DIAGNOSTICS_PATH =
  '/data-review?entry=input-return&role=preparer&phase=diagnostics'

export const VALID_DATA_REVIEW_ENTRIES = new Set(['input-return', 'review-return'])

export const DEMO_ROLE_STORAGE_KEY = 'protoc-demo-role'

/** Known hash routes (longest match first). */
const KNOWN_HASH_ROUTES = [
  '/check-return/insights',
  '/check-return-popout',
  '/check-return',
  '/import-confirmation',
  '/input-return',
  '/data-review-popout',
  '/data-review',
  '/smart-return',
] as const

/** Origin + Vite base path (trailing slash). */
export function getPrototypeBaseUrl(): string {
  const basePath = import.meta.env.BASE_URL || '/'
  if (basePath === '/') {
    return `${window.location.origin}/`
  }
  const normalized = basePath.endsWith('/') ? basePath : `${basePath}/`
  return `${window.location.origin}${normalized}`
}

/** Full URL for a hash route, e.g. origin + base + #/data-review?… */
export function buildHashRouteUrl(route: string): string {
  const normalized = route.startsWith('/') ? route : `/${route}`
  return `${getPrototypeBaseUrl()}#${normalized}`
}

/** Open a hash route in a new tab - preserves repo subpath on GitHub Pages. */
export function openHashRoute(route: string, target = '_blank'): void {
  window.open(buildHashRouteUrl(route), target, 'noopener,noreferrer')
}

export const SOURCE_DOCUMENT_REVIEW_POPOUT_PATH = '/data-review-popout'

/** BroadcastChannel for navigating an already-open source-doc popout. */
export const SOURCE_DOC_POPOUT_NAV_CHANNEL = 'protoc3-source-doc-popout-nav'

const SOURCE_DOC_POPOUT_WINDOW_NAME = 'smartreview-source-doc-review'

/** Shared popout window chrome - matches source document review dimensions. */
const PROTOTYPE_POPOUT_FEATURES = 'width=1447,height=960'

function openNamedPopoutWindow(url: string, windowName: string): Window | null {
  const opened = window.open(url, windowName, PROTOTYPE_POPOUT_FEATURES)
  if (opened) return opened
  // Popup blocked - fall back to a new browser tab (same as manual openHashRoute).
  window.open(url, '_blank', 'noopener,noreferrer')
  return null
}

let sourceDocPopoutWindow: Window | null = null

export type SourceDocumentPopoutContext = {
  tab?: string
  subTab?: string
  divPayer?: string
  intPayer?: string
  /** Detail field to focus in the input panel (View input). */
  field?: string
}

/** Build hash route for the detached source-document review window. */
export function buildSourceDocumentPopoutRoute(context?: SourceDocumentPopoutContext): string {
  const params = new URLSearchParams()
  if (context?.tab) params.set('tab', context.tab)
  if (context?.subTab) params.set('subTab', context.subTab)
  if (context?.divPayer) params.set('divPayer', context.divPayer)
  if (context?.intPayer) params.set('intPayer', context.intPayer)
  if (context?.field) params.set('field', context.field)
  const qs = params.toString()
  return qs ? `${SOURCE_DOCUMENT_REVIEW_POPOUT_PATH}?${qs}` : SOURCE_DOCUMENT_REVIEW_POPOUT_PATH
}

function postPopoutNavigation(context?: SourceDocumentPopoutContext): void {
  try {
    const channel = new BroadcastChannel(SOURCE_DOC_POPOUT_NAV_CHANNEL)
    channel.postMessage(context ?? {})
    channel.close()
  } catch {
    // ignore - hash update still applies on reload
  }
  if (sourceDocPopoutWindow && !sourceDocPopoutWindow.closed) {
    sourceDocPopoutWindow.postMessage(
      { type: 'source-doc-popout-nav', context: context ?? {} },
      window.location.origin,
    )
  }
}

/** Open source document review - reuses one popout window when already open. */
export function openSourceDocumentReviewPopout(
  context?: SourceDocumentPopoutContext,
): Window | null {
  const url = buildHashRouteUrl(buildSourceDocumentPopoutRoute(context))

  if (sourceDocPopoutWindow && !sourceDocPopoutWindow.closed) {
    sourceDocPopoutWindow.focus()
    try {
      const hashRoute = buildSourceDocumentPopoutRoute(context)
      const base = getPrototypeBaseUrl()
      sourceDocPopoutWindow.location.replace(`${base}#${hashRoute}`)
    } catch {
      sourceDocPopoutWindow.location.href = url
    }
    postPopoutNavigation(context)
    return sourceDocPopoutWindow
  }

  sourceDocPopoutWindow = openNamedPopoutWindow(url, SOURCE_DOC_POPOUT_WINDOW_NAME)
  return sourceDocPopoutWindow
}

/** Focused review-return popout - tax summary + output forms only. */
export const CHECK_RETURN_POPOUT_PATH = '/check-return-popout'

const REVIEW_RETURN_POPOUT_WINDOW_NAME = 'smartreview-review-return'

let reviewReturnPopoutWindow: Window | null = null

/** Build hash route for the focused review-return popout window. */
export function buildReviewReturnPopoutRoute(form: string = '1040'): string {
  return `${CHECK_RETURN_POPOUT_PATH}?form=${form}`
}

/** Open focused review-return window - reuses existing window when already open. */
export function openReviewReturnPopout(form: string = '1040'): Window | null {
  const url = buildHashRouteUrl(buildReviewReturnPopoutRoute(form))

  if (reviewReturnPopoutWindow && !reviewReturnPopoutWindow.closed) {
    reviewReturnPopoutWindow.focus()
    try {
      const base = getPrototypeBaseUrl()
      reviewReturnPopoutWindow.location.replace(`${base}#${buildReviewReturnPopoutRoute(form)}`)
    } catch {
      reviewReturnPopoutWindow.location.href = url
    }
    return reviewReturnPopoutWindow
  }

  reviewReturnPopoutWindow = openNamedPopoutWindow(url, REVIEW_RETURN_POPOUT_WINDOW_NAME)
  return reviewReturnPopoutWindow
}

/** Persist demo role for catch-all redirects when hash has no role param. */
export function setStoredDemoRole(role: 'preparer' | 'reviewer'): void {
  try {
    localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role)
  } catch {
    /* ignore */
  }
}

export function getStoredDemoRole(): 'preparer' | 'reviewer' | null {
  try {
    const v = localStorage.getItem(DEMO_ROLE_STORAGE_KEY)
    return v === 'reviewer' || v === 'preparer' ? v : null
  } catch {
    return null
  }
}

/**
 * Legacy `/data-review` hash routes → split preparer/reviewer experiences.
 * Returns null when the combined diagnostics demo should still render.
 */
export function resolveDataReviewRedirect(search = ''): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (params.get('phase') === 'diagnostics') return null

  const entry = params.get('entry')
  if (entry === 'input-return') return '/input-return'
  if (
    entry === 'review-return' ||
    params.get('role') === 'reviewer' ||
    params.get('startReview') === 'true'
  ) {
    return OUTPUT_REVIEW_PATH
  }
  return '/smart-return'
}

function applyDataReviewRedirect(route: string): string {
  if (!route.startsWith('/data-review')) return route
  const q = route.indexOf('?')
  const search = q === -1 ? '' : route.slice(q + 1)
  return resolveDataReviewRedirect(search) ?? route
}

/** Unknown hash routes → SmartReturn landing (role stored separately). */
export function resolveCatchAllRoute(_search = ''): string {
  return '/smart-return'
}

/**
 * GitHub Pages 404.html can serve index.html while the pathname stays polluted
 * (e.g. /SmartReview-AIc2/data-review with no hash). Repair to #/data-review.
 */
export function repairBarePathRoute(): string | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (hash.length > 0 && !hash.startsWith('%2F') && !hash.startsWith('%2f')) {
    return null
  }

  const pathname = window.location.pathname
  for (const route of KNOWN_HASH_ROUTES) {
    if (pathname.endsWith(route) || pathname.endsWith(`${route}/`)) {
      const baseEnd = pathname.length - route.length
      const basePath = pathname.slice(0, baseEnd)
      const search = window.location.search || ''
      const hashRoute = `${route}${search}`
      const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`
      window.history.replaceState(null, '', `${cleanBase}#${hashRoute}`)
      return hashRoute.startsWith('/') ? hashRoute : `/${hashRoute}`
    }
  }
  return null
}

/** Decode malformed hashes like #%2Fdata-review → #/data-review */
export function normalizeHashRoute(): string | null {
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw.includes('%2F') && !raw.includes('%2f')) return null
  try {
    const decoded = decodeURIComponent(raw)
    return decoded.startsWith('/') ? decoded : `/${decoded}`
  } catch {
    return null
  }
}

/** Run all hash/path repairs; returns route to navigate or null. */
export function repairIncomingRoute(): string | null {
  const raw = repairBarePathRoute() ?? normalizeHashRoute()
  if (!raw) return null
  return applyDataReviewRedirect(raw)
}
