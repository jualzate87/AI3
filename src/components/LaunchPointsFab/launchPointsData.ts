import {
  EMBEDDED_AI_DIAGNOSTICS_PATH,
  PREPARER_AGENT_DIAGNOSTICS_PATH,
  PREPARER_DIAGNOSTICS_PATH,
} from '../../lib/prototypeRoutes'

export type LaunchPointStatus = 'live' | 'stub'

export type LaunchPoint = {
  id: number
  title: string
  status: LaunchPointStatus
  description: string
  /** Hash route without # — navigates when set and status is live */
  route?: string
  /** Team member this point joins as — hidden when you already are that person. */
  joinAs?: string
}

export const LAUNCH_POINTS: LaunchPoint[] = [
  {
    id: 1,
    title: 'AI review',
    status: 'live',
    description:
      'Input return — skip Phase 1 and open the Phase 2 intelligence panel with diagnostic cards',
    route: PREPARER_DIAGNOSTICS_PATH,
  },
  {
    id: 2,
    title: 'AI Diags',
    status: 'live',
    description:
      'Earlier embedded Intuit Intelligence review with the AI review navigation and diagnostic overview',
    route: EMBEDDED_AI_DIAGNOSTICS_PATH,
  },
  {
    id: 3,
    title: 'Smart review — Agent mode',
    status: 'live',
    description: 'AI agent fixes diagnostics automatically with full reasoning trail',
    route: PREPARER_AGENT_DIAGNOSTICS_PATH,
  },
  {
    id: 4,
    title: 'Join as Jake — reviewer handoff',
    status: 'live',
    description:
      'Sarah hands off to Jake — proactive AI toast on Check return after ~2s; add ?prompt=popover for anchored variant',
    route: '/check-return?handoff=reviewer',
    joinAs: 'jake',
  },
  {
    id: 5,
    title: 'Join as Sarah — preparer handoff',
    status: 'live',
    description:
      'Jake sends the return back to Sarah with two open items — same proactive toast and catch-up summary, from her side',
    route: '/check-return?handoff=preparer',
    joinAs: 'sarah',
  },
]
