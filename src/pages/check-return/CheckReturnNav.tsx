import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Search } from '@design-systems/icons'
import { NumericBadge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import SegmentedButton from '@ids-ts/segmented-button'
import '@ids-ts/segmented-button/dist/main.css'
import { TextField } from '@ids-ts/text-field'
import '@ids-ts/text-field/dist/main.css'
import styles from '../../styles/check-return/CheckReturnNav.module.css'

export type ContentView = 'federal-summary' | 'california-summary' | 'form-1040'

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

const TAX_SUMMARY_ITEMS = [
  { id: 'federal-summary' as const, label: 'Federal Income Tax Summary' },
  { id: 'california-summary' as const, label: 'California Tax Summary' },
]

const DIAGNOSTIC_NAV_ITEMS: { label: string; badge?: number }[] = [
  { label: 'Fatal Diagnostics', badge: 1 },
  { label: 'EF Critical diagnostics', badge: 3 },
  { label: 'Critical Diagnostics', badge: 1 },
]

interface CheckReturnNavProps {
  contentView: ContentView
  selectedForm: string | null
  onSelectFederal: () => void
  onSelectCalifornia: () => void
  onSelectForm: (form: string) => void
}

function NavListItem({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`${styles.navListItem} ${active ? styles.navListItemActive : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default function CheckReturnNav({
  contentView,
  selectedForm,
  onSelectFederal,
  onSelectCalifornia,
  onSelectForm,
}: CheckReturnNavProps) {
  const navigate = useNavigate()
  const [formsExpanded, setFormsExpanded] = useState(true)
  const [taxSummaryExpanded, setTaxSummaryExpanded] = useState(true)
  const [formsMode, setFormsMode] = useState<'applicable' | 'all'>('applicable')
  const [formSearch, setFormSearch] = useState('')
  const [expandedJurisdictions, setExpandedJurisdictions] = useState<Record<string, boolean>>({
    US: true,
    CA: true,
  })

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

  const toggleJurisdiction = (jurisdiction: string) => {
    setExpandedJurisdictions(prev => ({
      ...prev,
      [jurisdiction]: !prev[jurisdiction],
    }))
  }

  return (
    <nav className={styles.inputMenu} aria-label="Check return navigation">
      <div className={styles.leftNav}>
        {/* Level 1: Forms */}
        <div className={styles.navSection}>
          <button
            type="button"
            className={styles.navSectionHeader}
            aria-expanded={formsExpanded}
            onClick={() => setFormsExpanded(prev => !prev)}
          >
            <span className={styles.navSectionLabel}>Forms</span>
            {formsExpanded ? (
              <ChevronUp size="small" className={styles.navSectionChevron} aria-hidden />
            ) : (
              <ChevronDown size="small" className={styles.navSectionChevron} aria-hidden />
            )}
          </button>

          {formsExpanded && (
            <div className={styles.navSectionPanel}>
              <div className={styles.formsControls}>
                <SegmentedButton
                  ariaLabel="Form filter"
                  buttonType="standard"
                  className={styles.formsSegmented}
                  buttonInfos={[
                    {
                      label: 'Applicable',
                      selected: formsMode === 'applicable',
                      onClick: () => setFormsMode('applicable'),
                    },
                    {
                      label: 'All',
                      selected: formsMode === 'all',
                      onClick: () => setFormsMode('all'),
                    },
                  ]}
                />

                <TextField
                  aria-label="Search forms"
                  placeholder="Search forms"
                  size="small"
                  value={formSearch}
                  onChange={e => setFormSearch(e.target.value)}
                  addonBefore={<Search size="small" aria-hidden />}
                />
              </div>

              {filteredFormGroups.map(group => {
                const jurisdictionExpanded = expandedJurisdictions[group.jurisdiction] ?? true
                return (
                  <div key={group.jurisdiction} className={styles.navGroup}>
                    <button
                      type="button"
                      className={styles.navGroupHeader}
                      aria-expanded={jurisdictionExpanded}
                      onClick={() => toggleJurisdiction(group.jurisdiction)}
                    >
                      <span className={styles.navGroupLabel}>{group.jurisdiction}</span>
                      {jurisdictionExpanded ? (
                        <ChevronUp size="small" className={styles.navGroupChevron} aria-hidden />
                      ) : (
                        <ChevronDown size="small" className={styles.navGroupChevron} aria-hidden />
                      )}
                    </button>

                    {jurisdictionExpanded && (
                      <div className={styles.navGroupPanel}>
                        {group.forms.map(form => (
                          <NavListItem
                            key={form}
                            label={form}
                            active={selectedForm === form && contentView === 'form-1040'}
                            onClick={() => onSelectForm(form)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Level 1: Tax Summary */}
        <div className={styles.navSection}>
          <button
            type="button"
            className={styles.navSectionHeader}
            aria-expanded={taxSummaryExpanded}
            onClick={() => setTaxSummaryExpanded(prev => !prev)}
          >
            <span className={styles.navSectionLabel}>Tax Summary</span>
            {taxSummaryExpanded ? (
              <ChevronUp size="small" className={styles.navSectionChevron} aria-hidden />
            ) : (
              <ChevronDown size="small" className={styles.navSectionChevron} aria-hidden />
            )}
          </button>

          {taxSummaryExpanded && (
            <div className={styles.navSectionPanel}>
              {TAX_SUMMARY_ITEMS.map(item => (
                <NavListItem
                  key={item.id}
                  label={item.label}
                  active={contentView === item.id}
                  onClick={item.id === 'federal-summary' ? onSelectFederal : onSelectCalifornia}
                />
              ))}
            </div>
          )}
        </div>

        {/* Flat nav items below Tax Summary */}
        <button
          type="button"
          className={styles.navFlatItem}
          onClick={() => navigate('/check-return/insights')}
        >
          <span className={styles.navFlatLabel}>Return Insights</span>
        </button>

        {DIAGNOSTIC_NAV_ITEMS.map(item => (
          <div key={item.label} className={styles.navFlatItem}>
            <span className={styles.navFlatLabel}>{item.label}</span>
            {item.badge != null && (
              <span className={styles.navBadge}>
                <NumericBadge quantity={String(item.badge)} maxLimit={99} />
              </span>
            )}
          </div>
        ))}

        <div className={styles.navFlatItem}>
          <span className={styles.navFlatLabel}>Overrides</span>
        </div>
        <div className={`${styles.navFlatItem} ${styles.navFlatItemLast}`}>
          <span className={styles.navFlatLabel}>Suggestions</span>
        </div>
      </div>
    </nav>
  )
}
