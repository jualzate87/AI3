import ScheduleAInterestInputPanel, {
  SCHEDULE_A_MORTGAGE_FIELD,
} from '../input-return/ScheduleAInterestInputPanel'
import styles from '../../styles/check-return/DiagnosticEmbed.module.css'

export default function ItemizeDiagnosticEmbed() {
  return (
    <section className={styles.embed} aria-label="Schedule A interest input">
      <ScheduleAInterestInputPanel
        variant="embed"
        autoFocusField
        highlightField={SCHEDULE_A_MORTGAGE_FIELD}
      />
    </section>
  )
}
