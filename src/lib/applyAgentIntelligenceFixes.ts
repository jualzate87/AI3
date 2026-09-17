import {
  ESTIMATED_MORTGAGE_INTEREST,
  NEC_SOURCE_AMOUNT,
  type LiveAmounts,
} from '../data/liveReturn'
import { SOURCE_AMOUNTS } from '../pages/data-review/phase2FlagSync'

export const AGENT_INTELLIGENCE_ACTOR = 'Intuit Intelligence'

/** Jessica Drake — matches W-2 source document. */
export const DEMO_EMPLOYEE_SSN = '987-65-4321'

/** Tech Circle Inc — matches W-2 source document (left unfixed in partial demo). */
export const DEMO_EMPLOYER_EIN = '94-1234567'

export type AgentIntelligenceFixResult = {
  amounts: Partial<LiveAmounts>
  /** Detail-fields / phase-1 reviewed keys cleared by the agent run. */
  reviewedFieldKeys: string[]
}

/**
 * Demo patch applied when Intuit Intelligence finishes its fix run.
 * W-2: corrects Box 1 wages + employee SSN; EIN and Box 12 stay open for follow-up.
 * Also restores other import-mismatch amounts shown in the fix-progress card.
 */
export function buildAgentIntelligenceDemoFixes(): AgentIntelligenceFixResult {
  return {
    amounts: {
      wages: SOURCE_AMOUNTS.wages,
      employeeSsn: DEMO_EMPLOYEE_SSN,
      divWithholding: SOURCE_AMOUNTS.divWithholding,
      rWithholding: SOURCE_AMOUNTS.rWithholding,
      taxablePension: SOURCE_AMOUNTS.taxablePension,
      qualifiedDivsToken: SOURCE_AMOUNTS.qualifiedDivsToken,
      necIncome: NEC_SOURCE_AMOUNT,
      necOnReturn: true,
      mortgageInterest: ESTIMATED_MORTGAGE_INTEREST,
    },
    reviewedFieldKeys: ['wages-techCircle', 'ssn-techCircle'],
  }
}
