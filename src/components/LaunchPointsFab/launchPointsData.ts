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
    title: 'Client detail · Documents',
    status: 'stub',
    description: '"Create a new request" in the shared-docs section',
  },
  {
    id: 4,
    title: 'Return · Return actions',
    status: 'stub',
    description: '"Collect data" in the Return actions menu',
  },
  {
    id: 5,
    title: 'Return · Data import hub',
    status: 'stub',
    description: '"Request client information → Send request"',
    route: '/import-confirmation',
  },
  {
    id: 6,
    title: 'Return · SmartReturn',
    status: 'stub',
    description: '"Request documents" on the document checklist',
    route: '/smart-return',
  },
  {
    id: 7,
    title: 'New client · Create tax return',
    status: 'live',
    description: '"Add new client → import 1040 → organizer"',
    route: '/smart-return',
  },
]
