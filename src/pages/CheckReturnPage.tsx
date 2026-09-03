import { useEffect } from 'react'
import { NumericBadge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import LeftNavPTO from './data-review/LeftNavPTO'
import SmartReturnHeader from './SmartReturnHeader'
import layout from '../styles/CoreScreenLayout.module.css'
import styles from '../styles/CheckReturnPage.module.css'

type TableRow =
  | { type: 'section'; label: string }
  | { type: 'data'; label: string; v2025: string; v2024: string; diff: string }

// Federal Income Tax Summary table — Figma node 33986:36535
const TABLE_ROWS: TableRow[] = [
  { type: 'section', label: 'INCOME' },
  { type: 'data', label: 'Wages, salaries, tips, etc', v2025: '148,940', v2024: '41,500', diff: '107,440' },
  { type: 'data', label: 'Interest income', v2025: '0', v2024: '1,500', diff: '-1,500' },
  { type: 'data', label: 'Dividend income', v2025: '0', v2024: '20,000', diff: '-20,000' },
  { type: 'data', label: 'Taxable pensions', v2025: '150,000', v2024: '0', diff: '150,000' },
  { type: 'data', label: 'Capital gain or loss', v2025: '0', v2024: '5,000', diff: '-5,000' },
  { type: 'data', label: 'Total income', v2025: '298,940', v2024: '80,160', diff: '218,780' },
  { type: 'section', label: 'ADJUSTMENTS TO INCOME' },
  { type: 'data', label: 'Total adjustments', v2025: '0', v2024: '0', diff: '0' },
  { type: 'data', label: 'Adjusted gross income', v2025: '298,940', v2024: '79,453', diff: '219,487' },
  { type: 'section', label: 'ITEMIZED DEDUCTIONS' },
  { type: 'data', label: 'Total itemized deductions', v2025: '0', v2024: '0', diff: '0' },
  { type: 'section', label: 'TAX COMPUTATION' },
  { type: 'data', label: 'Standard deduction', v2025: '31,500', v2024: '0', diff: '31,500' },
  { type: 'data', label: 'Larger of itemized or standard deduction', v2025: '31,500', v2024: '25,900', diff: '5,600' },
  { type: 'data', label: 'Taxable income', v2025: '267,440', v2024: '51,694', diff: '215,746' },
  { type: 'data', label: 'Tax before credits', v2025: '49,880', v2024: '0', diff: '49,880' },
  { type: 'section', label: 'CREDITS' },
  { type: 'data', label: 'Child tax credit & other dependent cr', v2025: '1,000', v2024: '0', diff: '1,000' },
  { type: 'data', label: 'Total credits', v2025: '1,000', v2024: '0', diff: '1,000' },
  { type: 'data', label: 'Tax after credits', v2025: '48,880', v2024: '0', diff: '48,880' },
  { type: 'section', label: 'OTHER TAXES' },
  { type: 'data', label: 'Other taxes', v2025: '0', v2024: '1,494', diff: '-1,494' },
  { type: 'data', label: 'Total tax', v2025: '48,880', v2024: '1,494', diff: '47,386' },
  { type: 'section', label: 'PAYMENTS & REFUNDABLE CREDITS' },
  { type: 'data', label: 'Federal income tax withheld', v2025: '45,840', v2024: '900', diff: '44,940' },
  { type: 'data', label: 'Earned income credit', v2025: '0', v2024: '500', diff: '-500' },
  { type: 'data', label: 'Refundable/Additional child tax credit', v2025: '0', v2024: '1,210', diff: '-1,210' },
  { type: 'data', label: 'Total payments', v2025: '45,840', v2024: '2,610', diff: '43,230' },
  { type: 'section', label: 'REFUND OR AMOUNT DUE' },
  { type: 'data', label: 'Amount overpaid', v2025: '0', v2024: '1,116', diff: '-1,116' },
  { type: 'data', label: 'Amount refunded to you', v2025: '0', v2024: '1,116', diff: '-1,116' },
  { type: 'data', label: 'Amount you owe', v2025: '3,040', v2024: '0', diff: '3,040' },
  { type: 'section', label: 'TAX RATES' },
  { type: 'data', label: 'Ordinary income tax bracket', v2025: '24.0%', v2024: '0.0%', diff: '24.0%' },
  { type: 'data', label: 'Effective tax rate', v2025: '18.3%', v2024: '0.0%', diff: '18.3%' },
]

const CHECK_NAV_ITEMS: { label: string; badge?: number }[] = [
  { label: 'Forms' },
  { label: 'Fatal Diagnostics', badge: 1 },
  { label: 'EF Critical diagnostics', badge: 1 },
  { label: 'Critical Diagnostics', badge: 1 },
  { label: 'Overrides' },
  { label: 'Suggestions' },
]

export default function CheckReturnPage() {
  useEffect(() => {
    const el = document.documentElement
    const prev = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'intuit')
    el.style.setProperty('--color-action-standard', '#205ea3')
    el.style.setProperty('--color-action-standard-hover', '#174d87')
    el.style.setProperty('--color-action-standard-active', '#174d87')
    return () => {
      if (prev) el.setAttribute('data-theme', prev)
      el.style.removeProperty('--color-action-standard')
      el.style.removeProperty('--color-action-standard-hover')
      el.style.removeProperty('--color-action-standard-active')
    }
  }, [])

  return (
    <div className={`${layout.page} ${styles.page}`} data-theme="intuit">
      <div className={layout.body}>
        <LeftNavPTO />
        <div className={layout.rightSide}>
          <SmartReturnHeader activeTab="checkreturns" />
          <div className={styles.contentArea}>
            {/* Input menu — left check navigation */}
            <nav className={styles.inputMenu} aria-label="Check return navigation">
              <div className={styles.leftNav}>
                <div className={styles.navCategory}>
                  <span className={styles.navCategoryLabel}>Tax Summary</span>
                </div>
                <div className={`${styles.navSecondary} ${styles.navSecondaryActive}`}>
                  <span className={styles.navSecondaryLabel}>Federal Income Tax Summary</span>
                </div>
                <div className={styles.navSecondary}>
                  <span className={styles.navSecondaryLabel}>California Tax Summary</span>
                </div>

                {CHECK_NAV_ITEMS.map((item, index) => (
                  <div
                    key={item.label}
                    className={`${styles.navCategory} ${index === CHECK_NAV_ITEMS.length - 1 ? styles.navCategoryLast : ''}`}
                  >
                    <span className={styles.navCategoryLabel}>{item.label}</span>
                    {item.badge != null && (
                      <span className={styles.navBadge}>
                        <NumericBadge quantity={String(item.badge)} maxLimit={99} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Main content — Federal Income Tax Summary */}
            <main className={styles.mainContent}>
              <div className={styles.formsListContainer}>
                <h1 className={styles.sectionTitle}>
                  Federal Income Tax Summary: Barry and Mary Wilson
                </h1>

                <div className={styles.tableScroll}>
                  <table className={styles.summaryTable}>
                    <thead>
                      <tr className={styles.tableHeaderRow}>
                        <th className={styles.colLabel} scope="col" />
                        <th className={styles.colValue} scope="col">2025</th>
                        <th className={styles.colValue} scope="col">2024</th>
                        <th className={styles.colValue} scope="col">DIFF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TABLE_ROWS.map((row) =>
                        row.type === 'section' ? (
                          <tr key={row.label} className={styles.sectionRow}>
                            <th className={styles.sectionCell} colSpan={4} scope="rowgroup">
                              {row.label}
                            </th>
                          </tr>
                        ) : (
                          <tr key={row.label} className={styles.dataRow}>
                            <th className={styles.colLabel} scope="row">{row.label}</th>
                            <td className={styles.colValue}>{row.v2025}</td>
                            <td className={styles.colValue}>{row.v2024}</td>
                            <td className={styles.colValue}>{row.diff}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
