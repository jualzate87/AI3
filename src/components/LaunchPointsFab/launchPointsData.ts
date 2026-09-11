import {
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
}

export const LAUNCH_POINTS: LaunchPoint[] = [
  {
    id: 1,
    title: 'Manual AI diagnostics',
    status: 'live',
    description: 'Phase 2 — skip import and open the AI diagnostics panel on the check-return flow',
    route: PREPARER_DIAGNOSTICS_PATH,
  },
  {
    id: 2,
    title: 'Smart review — Agent mode',
    status: 'live',
    description: 'AI agent fixes diagnostics automatically with full reasoning trail',
    route: PREPARER_AGENT_DIAGNOSTICS_PATH,
  },
]
