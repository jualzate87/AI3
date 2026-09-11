import { SOURCE_AMOUNTS } from '../data-review/phase2FlagSync'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import { DiagnosticFieldEmbed } from './DiagnosticFieldEmbed'
import styles from '../../styles/check-return/DiagnosticEmbed.module.css'

export default function UnderpaymentDiagnosticEmbed() {
  const { amounts } = useSyncedReviewState()
  const showR = amounts.rWithholding < SOURCE_AMOUNTS.rWithholding
  const showDiv = amounts.divWithholding < SOURCE_AMOUNTS.divWithholding

  if (!showR && !showDiv) return null

  return (
    <>
      {showR && (
        <DiagnosticFieldEmbed
          highlightField="withholding1099"
          tab="1099-rs"
          ariaLabel="1099-R federal withholding input"
        />
      )}
      {showR && showDiv && <div className={styles.embedDivider} aria-hidden />}
      {showDiv && (
        <DiagnosticFieldEmbed
          highlightField="fedTaxWithheld"
          tab="1099-divs"
          divPayer="tokenFinancial"
          ariaLabel="1099-DIV federal withholding input"
        />
      )}
    </>
  )
}
