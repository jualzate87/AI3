import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Search } from '@design-systems/icons'
import { NumericBadge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import LeftNavPTO from './data-review/LeftNavPTO'
import SmartReturnHeader from './SmartReturnHeader'
import layout from '../styles/CoreScreenLayout.module.css'
import styles from '../styles/CheckReturnPage.module.css'

type ContentView = 'federal-summary' | 'california-summary' | 'form-1040'

type TableRow =
  | { type: 'section'; label: string }
  | { type: 'data'; label: string; v2023: string; v2024: string; diff: string }

const TABLE_ROWS: TableRow[] = [
  { type: 'section', label: 'INCOME' },
  { type: 'data', label: 'Wages, salaries, tips, etc', v2023: '148,940', v2024: '41,500', diff: '107,440' },
  { type: 'data', label: 'Interest income', v2023: '0', v2024: '1,500', diff: '-1,500' },
  { type: 'data', label: 'Dividend income', v2023: '0', v2024: '20,000', diff: '-20,000' },
  { type: 'data', label: 'Taxable pensions', v2023: '150,000', v2024: '0', diff: '150,000' },
  { type: 'data', label: 'Capital gain or loss', v2023: '0', v2024: '5,000', diff: '-5,000' },
  { type: 'data', label: 'Total income', v2023: '298,940', v2024: '80,160', diff: '218,780' },
  { type: 'section', label: 'ADJUSTMENTS TO INCOME' },
  { type: 'data', label: 'Total adjustments', v2023: '0', v2024: '0', diff: '0' },
  { type: 'data', label: 'Adjusted gross income', v2023: '298,940', v2024: '79,453', diff: '219,487' },
  { type: 'section', label: 'ITEMIZED DEDUCTIONS' },
  { type: 'data', label: 'Total itemized deductions', v2023: '0', v2024: '0', diff: '0' },
  { type: 'section', label: 'TAX COMPUTATION' },
  { type: 'data', label: 'Standard deduction', v2023: '31,500', v2024: '0', diff: '31,500' },
  { type: 'data', label: 'Larger of itemized or standard deduction', v2023: '31,500', v2024: '25,900', diff: '5,600' },
  { type: 'data', label: 'Taxable income', v2023: '267,440', v2024: '51,694', diff: '215,746' },
  { type: 'data', label: 'Tax before credits', v2023: '49,880', v2024: '0', diff: '49,880' },
  { type: 'section', label: 'CREDITS' },
  { type: 'data', label: 'Child tax credit & other dependent cr', v2023: '1,000', v2024: '0', diff: '1,000' },
  { type: 'data', label: 'Total credits', v2023: '1,000', v2024: '0', diff: '1,000' },
  { type: 'data', label: 'Tax after credits', v2023: '48,880', v2024: '0', diff: '48,880' },
  { type: 'section', label: 'OTHER TAXES' },
  { type: 'data', label: 'Other taxes', v2023: '0', v2024: '1,494', diff: '-1,494' },
  { type: 'data', label: 'Total tax', v2023: '48,880', v2024: '1,494', diff: '47,386' },
  { type: 'section', label: 'PAYMENTS & REFUNDABLE CREDITS' },
  { type: 'data', label: 'Federal income tax withheld', v2023: '45,840', v2024: '900', diff: '44,940' },
  { type: 'data', label: 'Earned income credit', v2023: '0', v2024: '500', diff: '-500' },
  { type: 'data', label: 'Refundable/Additional child tax credit', v2023: '0', v2024: '1,210', diff: '-1,210' },
  { type: 'data', label: 'Total payments', v2023: '45,840', v2024: '2,610', diff: '43,230' },
  { type: 'section', label: 'REFUND OR AMOUNT DUE' },
  { type: 'data', label: 'Amount overpaid', v2023: '0', v2024: '1,116', diff: '-1,116' },
  { type: 'data', label: 'Amount refunded to you', v2023: '0', v2024: '1,116', diff: '-1,116' },
  { type: 'data', label: 'Amount you owe', v2023: '3,040', v2024: '0', diff: '3,040' },
  { type: 'section', label: 'TAX RATES' },
  { type: 'data', label: 'Ordinary income tax bracket', v2023: '24.0%', v2024: '0.0%', diff: '24.0%' },
  { type: 'data', label: 'Effective tax rate', v2023: '18.3%', v2024: '0.0%', diff: '18.3%' },
]

const APPLICABLE_FORMS = [
  {
    jurisdiction: 'US',
    forms: ['Letter (US Standard)', 'General Info.', '1040', 'Sch 1', 'Sch B', 'Sch D'],
  },
  {
    jurisdiction: 'CA',
    forms: ['540', 'Sch CA (540)'],
  },
]

const ALL_FORMS = [
  {
    jurisdiction: 'US',
    forms: [
      'Letter (US Standard)',
      'General Info.',
      '1040',
      'Sch 1',
      'Sch 2',
      'Sch 3',
      'Sch B',
      'Sch D',
      'Sch E',
      'Form 8949',
    ],
  },
  {
    jurisdiction: 'CA',
    forms: ['540', 'Sch CA (540)', 'Sch P (540)'],
  },
]

const DIAGNOSTIC_NAV_ITEMS: { label: string; badge?: number }[] = [
  { label: 'Fatal Diagnostics', badge: 1 },
  { label: 'EF Critical diagnostics', badge: 3 },
  { label: 'Critical Diagnostics', badge: 1 },
]

export default function CheckReturnPage() {
  const navigate = useNavigate()
  const [contentView, setContentView] = useState<ContentView>('federal-summary')
  const [formsExpanded, setFormsExpanded] = useState(true)
  const [formsMode, setFormsMode] = useState<'applicable' | 'all'>('applicable')
  const [formSearch, setFormSearch] = useState('')
  const [selectedForm, setSelectedForm] = useState<string | null>(null)

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

  const formGroups = formsMode === 'applicable' ? APPLICABLE_FORMS : ALL_FORMS
  const normalizedSearch = formSearch.trim().toLowerCase()

  const filteredFormGroups = useMemo(
    () =>
      formGroups
        .map(group => ({
          ...group,
          forms: group.forms.filter(
            form => !normalizedSearch || form.toLowerCase().includes(normalizedSearch),
          ),
        }))
        .filter(group => group.forms.length > 0),
    [formGroups, normalizedSearch],
  )

  const handleSelectFederal = () => {
    setContentView('federal-summary')
    setSelectedForm(null)
  }

  const handleSelectCalifornia = () => {
    setContentView('california-summary')
    setSelectedForm(null)
  }

  const handleSelectForm = (form: string) => {
    setSelectedForm(form)
    if (form === '1040') {
      setContentView('form-1040')
    }
  }

  return (
    <div className={`${layout.page} ${styles.page}`} data-theme="intuit">
      <div className={layout.body}>
        <LeftNavPTO />
        <div className={layout.rightSide}>
          <SmartReturnHeader activeTab="checkreturns" />
          <div className={styles.contentArea}>
            <nav className={styles.inputMenu} aria-label="Check return navigation">
              <div className={styles.leftNav}>
                <div className={styles.navCategoryGroup}>
                  <button
                    type="button"
                    className={styles.navCategory}
                    aria-expanded={formsExpanded}
                    onClick={() => setFormsExpanded(prev => !prev)}
                  >
                    <span className={styles.navCategoryLabel}>Forms</span>
                    {formsExpanded ? (
                      <ChevronUp size="small" className={styles.navCategoryChevron} aria-hidden />
                    ) : (
                      <ChevronDown size="small" className={styles.navCategoryChevron} aria-hidden />
                    )}
                  </button>

                  {formsExpanded && (
                    <div className={styles.formsPanel}>
                      <div className={styles.formsToggle} role="tablist" aria-label="Form filter">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={formsMode === 'applicable'}
                          className={`${styles.formsToggleBtn} ${formsMode === 'applicable' ? styles.formsToggleBtnActive : ''}`}
                          onClick={() => setFormsMode('applicable')}
                        >
                          Applicable
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={formsMode === 'all'}
                          className={`${styles.formsToggleBtn} ${formsMode === 'all' ? styles.formsToggleBtnActive : ''}`}
                          onClick={() => setFormsMode('all')}
                        >
                          All
                        </button>
                      </div>

                      <label className={styles.searchWrap}>
                        <span className={styles.visuallyHidden}>Search forms</span>
                        <Search size="small" className={styles.searchIcon} aria-hidden />
                        <input
                          type="search"
                          className={styles.searchInput}
                          placeholder="Search forms"
                          value={formSearch}
                          onChange={e => setFormSearch(e.target.value)}
                        />
                      </label>

                      {filteredFormGroups.map(group => (
                        <div key={group.jurisdiction} className={styles.formJurisdiction}>
                          <div className={styles.formJurisdictionLabel}>{group.jurisdiction}</div>
                          {group.forms.map(form => {
                            const isActive = selectedForm === form && contentView === 'form-1040' && form === '1040'
                            return (
                              <button
                                key={form}
                                type="button"
                                className={`${styles.formListItem} ${isActive ? styles.formListItemActive : ''}`}
                                onClick={() => handleSelectForm(form)}
                              >
                                {form}
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.navCategory}>
                  <span className={styles.navCategoryLabel}>Tax Summary</span>
                </div>
                <button
                  type="button"
                  className={`${styles.navSecondary} ${contentView === 'federal-summary' ? styles.navSecondaryActive : ''}`}
                  onClick={handleSelectFederal}
                >
                  <span className={styles.navSecondaryLabel}>Federal Income Tax Summary</span>
                </button>
                <button
                  type="button"
                  className={`${styles.navSecondary} ${contentView === 'california-summary' ? styles.navSecondaryActive : ''}`}
                  onClick={handleSelectCalifornia}
                >
                  <span className={styles.navSecondaryLabel}>California Tax Summary</span>
                </button>

                <button
                  type="button"
                  className={styles.navCategory}
                  onClick={() => navigate('/check-return/insights')}
                >
                  <span className={styles.navCategoryLabel}>Return Insights</span>
                </button>

                {DIAGNOSTIC_NAV_ITEMS.map(item => (
                  <div key={item.label} className={styles.navCategory}>
                    <span className={styles.navCategoryLabel}>{item.label}</span>
                    {item.badge != null && (
                      <span className={styles.navBadge}>
                        <NumericBadge quantity={String(item.badge)} maxLimit={99} />
                      </span>
                    )}
                  </div>
                ))}

                <div className={styles.navCategory}>
                  <span className={styles.navCategoryLabel}>Overrides</span>
                </div>
                <div className={`${styles.navCategory} ${styles.navCategoryLast}`}>
                  <span className={styles.navCategoryLabel}>Suggestions</span>
                </div>
              </div>
            </nav>

            <main className={styles.mainContent}>
              {contentView === 'federal-summary' && (
                <div className={styles.formsListContainer}>
                  <h1 className={styles.sectionTitle}>
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
                        {TABLE_ROWS.map(row =>
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
                <div className={styles.formsListContainer}>
                  <h1 className={styles.sectionTitle}>California Tax Summary: Barry and Mary Wilson</h1>
                  <p className={styles.placeholderText}>California summary details are not available in this prototype.</p>
                </div>
              )}

              {contentView === 'form-1040' && (
                <div className={styles.formsListContainer}>
                  <h1 className={styles.sectionTitle}>1040: 2024 U.S. Individual Income Tax Return</h1>
                  <p className={styles.formHelpText}>
                    Double-click a field to jump to the input screen. Right-click for more options.
                  </p>
                  <div className={styles.formPreviewPlaceholder} aria-label="Form 1040 preview placeholder">
                    <p>Form 1040 preview</p>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
