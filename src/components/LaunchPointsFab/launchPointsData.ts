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
    title: 'Tax Returns page',
    status: 'live',
    description: '"Send client request" in the Data column',
  },
  {
    id: 2,
    title: 'Collaboration hub',
    status: 'live',
    description: '"New client request" quick action',
  },
  {
    id: 3,
    title: 'New client · Create tax return',
    status: 'live',
    description: '"Add new client → import 1040 → organizer"',
    route: '/smart-return',
  },
  {
    id: 4,
    title: 'Phase 2 — AI Diagnostics',
    status: 'live',
    description: 'Skip to Step 2 with the AI diagnostics panel open',
    route: PREPARER_DIAGNOSTICS_PATH,
  },
  {
    id: 5,
    title: 'Smart review — Agent mode',
    status: 'live',
    description: 'AI agent fixes diagnostics automatically with full reasoning trail',
    route: PREPARER_AGENT_DIAGNOSTICS_PATH,
  },
]
