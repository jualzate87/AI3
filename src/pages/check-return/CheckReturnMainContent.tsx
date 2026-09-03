import OutputReviewPanel from './OutputReviewPanel'
import { checkReturnFormToOutputId } from './outputFormNav'
import type { ContentView } from './CheckReturnNav'
import type { OutputFormId } from '../data-review/outputForms'
import { FEDERAL_SUMMARY_ROWS } from './checkReturnSummaryData'
import styles from '../../styles/CheckReturnPage.module.css'
import panel from '../../styles/shared/ReturnMainPanel.module.css'

interface CheckReturnMainContentProps {
  contentView: ContentView
  selectedForm: string | null
  outputFormId: OutputFormId
}

export default function CheckReturnMainContent({
  contentView,
  selectedForm,
  outputFormId,
}: CheckReturnMainContentProps) {
  return (
    <main
      className={
        contentView === 'form-output'
          ? `${panel.pageScroll} ${styles.outputMain}`
          : panel.pageScroll
      }
    >
      {contentView === 'federal-summary' && (
        <div className={panel.contentBody}>
          <h1 className={panel.pageTitle}>
            Federal Income Tax Summary: Barry and Mary Wilson
          </h1>
          <div className={styles.tableScroll}>
            <table className={styles.summaryTable}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.colLabel} scope="col" />
                  <th className={styles.colValue} scope="col">2023</th>
                  <th className={styles.colValue} scope="col">2024</th>
                  <th className={styles.colValue} scope="col">DIFF</th>
                </tr>
              </thead>
              <tbody>
                {FEDERAL_SUMMARY_ROWS.map(row =>
                  row.type === 'section' ? (
                    <tr key={row.label} className={styles.sectionRow}>
                      <th className={styles.sectionCell} colSpan={4} scope="rowgroup">
                        {row.label}
                      </th>
                    </tr>
                  ) : (
                    <tr key={row.label} className={styles.dataRow}>
                      <th className={styles.colLabel} scope="row">{row.label}</th>
                      <td className={styles.colValue}>{row.v2023}</td>
                      <td className={styles.colValue}>{row.v2024}</td>
                      <td className={styles.colValue}>{row.diff}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {contentView === 'california-summary' && (
        <div className={panel.contentBody}>
          <h1 className={panel.pageTitle}>California Tax Summary: Barry and Mary Wilson</h1>
          <p className={panel.bodyText}>California summary details are not available in this prototype.</p>
        </div>
      )}

      {contentView === 'form-output' && (
        <>
          {checkReturnFormToOutputId(selectedForm ?? '1040') ? (
            <OutputReviewPanel outputFormId={outputFormId} />
          ) : (
            <div className={panel.contentBody}>
              <h1 className={panel.pageTitle}>
                {selectedForm ?? 'Form'} preview
              </h1>
              <p className={panel.bodyText}>
                This form is not interactive in the prototype yet. Select 1040, Sch 1, Sch C, or Sch D from the Forms list.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  )
}
