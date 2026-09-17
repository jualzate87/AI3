import type { ProcessingMode } from './useAgentProcessingAnimation'

export type AgentStep = 'welcome' | 'diagnostics' | 'processing' | 'catch-up' | 'workspace'

export type AgentSession = {
  step: AgentStep
  processingMode: ProcessingMode
}

const SESSION_KEY = 'protoc3-agent-session'

/**
 * Steps that hold generated content. Reopening the panel returns to one of
 * these; 'welcome' and 'workspace' have nothing to come back to.
 */
const RESUMABLE_STEPS: AgentStep[] = ['diagnostics', 'processing', 'catch-up']

export function isResumableStep(step: AgentStep): boolean {
  return RESUMABLE_STEPS.includes(step)
}

export function loadAgentSession(): AgentSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AgentSession>
    if (!parsed.step || !isResumableStep(parsed.step)) return null
    return {
      step: parsed.step,
      processingMode: parsed.processingMode === 'sequential' ? 'sequential' : 'batch',
    }
  } catch {
    return null
  }
}

export function saveAgentSession(session: AgentSession): void {
  if (!isResumableStep(session.step)) return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // ignore prototype storage errors
  }
}

/** Starting a new chat drops the conversation so the panel opens on the welcome screen. */
export function clearAgentSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
