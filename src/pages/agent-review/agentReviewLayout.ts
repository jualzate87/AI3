export type AgentReviewLayoutMode = 'fullscreen' | 'sidebar' | 'floating'

export const AGENT_LAYOUT_STORAGE_KEY = 'protoc3-agent-layout'

export const AGENT_LAYOUT_LABELS: Record<AgentReviewLayoutMode, string> = {
  floating: 'Floating',
  sidebar: 'Sidebar',
  fullscreen: 'Full screen',
}

export function isAgentReviewLayoutMode(value: unknown): value is AgentReviewLayoutMode {
  return value === 'floating' || value === 'sidebar' || value === 'fullscreen'
}

export function readStoredLayoutMode(): AgentReviewLayoutMode | null {
  try {
    const raw = sessionStorage.getItem(AGENT_LAYOUT_STORAGE_KEY)
    return isAgentReviewLayoutMode(raw) ? raw : null
  } catch {
    return null
  }
}

export function persistLayoutMode(mode: AgentReviewLayoutMode): void {
  try {
    sessionStorage.setItem(AGENT_LAYOUT_STORAGE_KEY, mode)
  } catch {
    // ignore
  }
}

export function resolveInitialLayoutMode(options?: {
  navigationState?: unknown
  searchParams?: URLSearchParams
}): AgentReviewLayoutMode {
  const navState = options?.navigationState as { layoutMode?: unknown } | null | undefined
  if (isAgentReviewLayoutMode(navState?.layoutMode)) {
    return navState.layoutMode
  }

  const queryLayout = options?.searchParams?.get('layout')
  if (isAgentReviewLayoutMode(queryLayout)) {
    return queryLayout
  }

  return readStoredLayoutMode() ?? 'fullscreen'
}
