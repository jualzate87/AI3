/** Field panel mode - controls whether values can be edited in place. */
export type DetailFieldsVariant = 'review' | 'input' | 'display'

/**
 * Input-return editable keys (variant === 'input').
 * Form layout / summary lines stay display-only; only true input fields edit.
 */
const INPUT_EDITABLE_PATTERNS: RegExp[] = [
  /^ssn(-|$)/,
  /^ein(-|$)/,
  /^recipientSsn-/,
  /^wages$/,
  /^withholding$/,
  /^box12$/,
  /^box12[a-d]-amt-/,
  /^taxableInterest$/,
  /^taxableInterest-/,
  /^qualifiedDivs$/,
  /^qualifiedDivs-/,
  /^ordinaryDivs-/,
  /^nec-box1$/,
  /^r-taxableAmt$/,
  /^r-fedTaxWithheld$/,
  /^fedTaxWithheld$/,
]

/** Whether a field key supports in-place editing for the current variant. */
export function canEditField(
  fieldKey: string,
  variant: DetailFieldsVariant,
  importReadOnly = false,
): boolean {
  if (importReadOnly || variant === 'display') return false
  if (variant === 'review') return true
  return INPUT_EDITABLE_PATTERNS.some(pattern => pattern.test(fieldKey))
}

/** True when the field should use read-only display chrome (bordered box, no edit affordance). */
export function isDisplayOnlyField(
  fieldKey: string,
  variant: DetailFieldsVariant,
  importReadOnly = false,
): boolean {
  return !canEditField(fieldKey, variant, importReadOnly)
}

/** Numeric display fields are right-aligned to match summary / form output styling. */
export function isNumericDisplayField(inputClassName: string): boolean {
  return inputClassName.includes('fieldInputSmall')
}
