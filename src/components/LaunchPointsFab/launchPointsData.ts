import {
  EMBEDDED_AI_DIAGNOSTICS_PATH,
  PREPARER_AGENT_DIAGNOSTICS_PATH,
  PREPARER_DIAGNOSTICS_PATH,
} from '../../lib/prototypeRoutes'

export type LaunchPointStatus = 'live' | 'stub'

export type LaunchPoint = {
  id: string
  title: string
  status: LaunchPointStatus
  description: string
  /** Hash route without # — navigates when set and status is live */
  route?: string
  /** Team member this point joins as — shown only when you are not that person. */
  joinAs?: string
}

export const ROLE_SWITCH_POINTS: LaunchPoint[] = [
  {
    id: 'join-jake',
    title: 'Switch to Jake',
    status: 'live',
    description: 'Join the return as Jake after Sarah hands it off',
    route: '/check-return?handoff=reviewer',
    joinAs: 'jake',
  },
  {
    id: 'join-sarah',
    title: 'Switch to Sarah',
    status: 'live',
    description: 'Join the return as Sarah after Jake sends it back',
    route: '/check-return?handoff=preparer',
    joinAs: 'sarah',
  },
]

export const OTHER_FLOWS: LaunchPoint[] = [
  {
    id: 'ai-review',
    title: 'AI review',
    status: 'live',
    description:
      'Input return — skip Phase 1 and open the Phase 2 intelligence panel with diagnostic cards',
    route: PREPARER_DIAGNOSTICS_PATH,
  },
  {
    id: 'ai-diags',
    title: 'AI Diags',
    status: 'live',
    description:
      'Earlier embedded Intuit Intelligence review with the AI review navigation and diagnostic overview',
    route: EMBEDDED_AI_DIAGNOSTICS_PATH,
  },
  {
    id: 'agent-mode',
    title: 'Smart review — Agent mode',
    status: 'live',
    description: 'AI agent fixes diagnostics automatically with full reasoning trail',
    route: PREPARER_AGENT_DIAGNOSTICS_PATH,
  },
]
