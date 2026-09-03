import type { OutputFormId } from '../data-review/outputForms'

/** Map Check return left-nav form labels → interactive output form id. */
const CHECK_RETURN_FORM_MAP: Record<string, OutputFormId> = {
  '1040': '1040',
  'Sch 1': 'sch1',
  'Sch C': 'schC',
  'Sch D': 'schD',
  'Sch A': 'schA',
  'Form 8949': 'schD',
}

export function checkReturnFormToOutputId(formLabel: string): OutputFormId | null {
  return CHECK_RETURN_FORM_MAP[formLabel] ?? null
}

export function outputFormDisplayTitle(formId: OutputFormId): string {
  switch (formId) {
    case '1040':
      return '1040: 2024 U.S. Individual Income Tax Return'
    case 'sch1':
      return 'Schedule 1: Additional Income and Adjustments to Income'
    case 'schC':
      return 'Schedule C: Profit or Loss From Business'
    case 'schD':
      return 'Schedule D: Capital Gains and Losses'
    case 'schA':
      return 'Schedule A: Itemized Deductions'
    case 'f8960':
      return 'Form 8960: Net Investment Income Tax'
    case 'f2210':
      return 'Form 2210: Underpayment of Estimated Tax'
    default:
      return 'Return Summary'
  }
}
