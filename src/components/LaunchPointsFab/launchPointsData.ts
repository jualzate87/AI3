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
    title: 'AI review',
    status: 'live',
    description:
      'Input return — skip Phase 1 and open the Phase 2 intelligence panel with diagnostic cards',
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
