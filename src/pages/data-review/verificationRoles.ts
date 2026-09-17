import type { ReviewLevel } from './AttestColumns'

/** Full role names for legend and column-header tooltips (L1/L2/L3 stay in headers). */
export const VERIFICATION_LEVEL_LABELS: Record<ReviewLevel, string> = {
  1: 'Preparer verified',
  2: 'Reviewer confirmed',
  3: 'Manager confirmed',
}
