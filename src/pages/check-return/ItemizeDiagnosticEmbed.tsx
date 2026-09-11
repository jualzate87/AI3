import PageMessage from '@ids-ts/page-message'
import '@ids-ts/page-message/dist/main.css'
import { B3 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import ScheduleAInterestInputPanel, {
  SCHEDULE_A_MORTGAGE_FIELD,
} from '../input-return/ScheduleAInterestInputPanel'
import styles from '../../styles/check-return/ItemizeDiagnosticEmbed.module.css'

export default function ItemizeDiagnosticEmbed() {
  return (
    <section className={styles.embed} aria-label="Fix on input screen">
      <PageMessage type="error" title="Missing Form 1098 mortgage interest" open dismissible={false}>
        <B3>
          Schedule A line 8a is empty because the Form 1098 was not imported. Enter the amount in
          the Input return screen below to post mortgage interest and recalculate itemized
          deductions.
        </B3>
      </PageMessage>

      <div className={styles.inputShell}>
        <ScheduleAInterestInputPanel
          variant="embed"
          autoFocusField
          highlightField={SCHEDULE_A_MORTGAGE_FIELD}
        />
      </div>
    </section>
  )
}
