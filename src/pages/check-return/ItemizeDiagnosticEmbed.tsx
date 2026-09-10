import PageMessage from '@ids-ts/page-message'
import '@ids-ts/page-message/dist/main.css'
import { B3 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import { getQuestionnaireSourceLabel, QUESTIONNAIRE_RESPONSES } from '../data-review/questionnaireData'
import MortgageInterestInputField from '../data-review/MortgageInterestInputField'
import styles from '../../styles/check-return/ItemizeDiagnosticEmbed.module.css'

const MORTGAGE_RESPONSE = QUESTIONNAIRE_RESPONSES.find(q => q.id === 'mortgage')

export default function ItemizeDiagnosticEmbed() {
  if (!MORTGAGE_RESPONSE) return null

  return (
    <section className={styles.embed} aria-label="Fix on input screen">
      <PageMessage type="error" title="Missing Form 1098 mortgage interest" open dismissible={false}>
        <B3>
          The return is using the standard deduction because Schedule A line 8a is empty. Enter the
          Form 1098 amount below to post mortgage interest and recalculate itemized deductions.
        </B3>
      </PageMessage>

      <div className={styles.inputPanel}>
        <header className={styles.inputPanelHeader}>
          <h2 className={styles.inputPanelTitle}>Details: Questionnaire · Home / mortgage</h2>
          <span className={styles.inputPanelMeta}>
            {getQuestionnaireSourceLabel(MORTGAGE_RESPONSE.sourceChannel)} ·{' '}
            {MORTGAGE_RESPONSE.date}
          </span>
        </header>

        <p className={styles.question}>
          <span className={styles.questionLabel}>Asked</span>
          {MORTGAGE_RESPONSE.question}
        </p>

        <div className={styles.bubble}>
          <span className={styles.avatar} aria-hidden="true">
            JD
          </span>
          <div className={styles.qaText}>
            <span className={styles.qaName}>
              {MORTGAGE_RESPONSE.clientName} · {MORTGAGE_RESPONSE.date}
            </span>
            <p className={styles.qaAnswer}>{MORTGAGE_RESPONSE.answer}</p>
          </div>
        </div>

        <div className={styles.fieldSection}>
          <MortgageInterestInputField autoFocus />
        </div>
      </div>
    </section>
  )
}
