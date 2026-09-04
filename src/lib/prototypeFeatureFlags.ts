/**
 * ProtoC3 prototype toggles - flip these to restore hidden UI without deleting logic.
 */

/** When false, Phase 1 import/OCR flags remain in reviewedFields but are hidden in the UI. */
export const SHOW_IMPORT_FLAGS = false

/** When false, SSN/EIN identity gates are skipped - preparers can mark verified without identity fields. */
export const SHOW_VERIFY_IDENTITY_GATES = false

/** When false, pink coach pointer dots on (i) info icons and other CoachTip anchors are hidden. */
export const SHOW_FIELD_INFO_POINTERS = false

/** Mask flag counts for tab/peel badges when import flags are hidden. */
export function importFlagCountForDisplay(count: number): number {
  return SHOW_IMPORT_FLAGS ? count : 0
}

/** Mask flagged-field maps passed into DetailFields (preserves mergeInputFlags call sites). */
export function importFlagsForDisplay(flags: Record<string, string>): Record<string, string> {
  return SHOW_IMPORT_FLAGS ? flags : {}
}

/** Whether Summary rows should show Phase 1 import-attention cues. */
export function showSummaryImportAttention(): boolean {
  return SHOW_IMPORT_FLAGS
}
