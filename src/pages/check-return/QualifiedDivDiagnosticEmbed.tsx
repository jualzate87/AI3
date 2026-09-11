import { computeQualifiedDivOverstatement } from '../../data/liveReturn'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import { DiagnosticFieldEmbed } from './DiagnosticFieldEmbed'

export default function QualifiedDivDiagnosticEmbed() {
  const { amounts } = useSyncedReviewState()
  const { overstated } = computeQualifiedDivOverstatement(amounts)
  if (overstated <= 0) return null

  return (
    <DiagnosticFieldEmbed
      highlightField="qualifiedDivs"
      tab="1099-divs"
      divPayer="tokenFinancial"
      ariaLabel="1099-DIV qualified dividends input"
    />
  )
}
