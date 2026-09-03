import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, ChevronUp, Search } from '@design-systems/icons'
import { NumericBadge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import ModeSegmentedControl from '../../components/ModeSegmentedControl'
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
  { label: 'EF Critical diagnostics', badge: 1 },
  { label: 'Critical Diagnostics', badge: 1 },
]

interface CheckReturnNavProps {
  contentView: ContentView
  selectedForm: string | null
  onSelectFederal: () => void
  onSelectCalifornia: () => void
  onSelectForm: (form: string) => void
}

function NavCategoryHeader({
  label,
  expanded,
  onToggle,
  isLast = false,
}: {
  label: string
  expanded: boolean
  onToggle: () => void
  isLast?: boolean
}) {
  return (
    <button
      type="button"
      className={[styles.navCategoryHeader, isLast ? styles.navCategoryHeaderLast : '']
        .filter(Boolean)
        .join(' ')}
      aria-expanded={expanded}
      onClick={onToggle}
    >
      <span className={styles.navCategoryLabel}>{label}</span>
      {expanded ? (
        <ChevronUp size="small" className={styles.navCategoryChevron} aria-hidden />
      ) : (
        <ChevronRight size="small" className={styles.navCategoryChevron} aria-hidden />
      )}
    </button>
  )
}

function NavSecondaryItem({
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
      className={[styles.navSecondaryItem, active ? styles.navSecondaryItemActive : '']
        .filter(Boolean)
        .join(' ')}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function NavFlatRow({
  label,
  badge,
  onClick,
  isLast = false,
}: {
  label: string
  badge?: number
  onClick?: () => void
  isLast?: boolean
}) {
  const className = [styles.navFlatRow, isLast ? styles.navFlatRowLast : '']
    .filter(Boolean)
    .join(' ')

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        <span className={styles.navFlatLabel}>{label}</span>
        {badge != null && (
          <span className={styles.navBadge}>
            <NumericBadge quantity={String(badge)} maxLimit={99} />
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={className}>
      <span className={styles.navFlatLabel}>{label}</span>
      {badge != null && (
        <span className={styles.navBadge}>
          <NumericBadge quantity={String(badge)} maxLimit={99} />
        </span>
      )}
    </div>
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
  const [expandedCategory, setExpandedCategory] = useState<'forms' | 'tax-summary' | null>(
    'forms',
  )

  const toggleCategory = (category: 'forms' | 'tax-summary') => {
    setExpandedCategory(prev => (prev === category ? null : category))
  }
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
          <NavCategoryHeader
            label="Forms"
            expanded={expandedCategory === 'forms'}
            onToggle={() => toggleCategory('forms')}
          />

          {expandedCategory === 'forms' && (
            <div className={styles.formsPanel}>
              <div className={styles.formsControls}>
                <ModeSegmentedControl
                  ariaLabel="Form filter"
                  activeId={formsMode}
                  options={[
                    {
                      id: 'applicable',
                      label: 'Applicable',
                      onClick: () => setFormsMode('applicable'),
                    },
                    {
                      id: 'all',
                      label: 'All',
                      onClick: () => setFormsMode('all'),
                    },
                  ]}
                />

                <TextField
                  aria-label="Search forms"
                  placeholder="Search forms"
                  size="small"
                  width="100%"
                  className={styles.formsSearchField}
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

                    {jurisdictionExpanded &&
                      group.forms.map(form => (
                        <NavSecondaryItem
                          key={form}
                          label={form}
                          active={selectedForm === form && contentView === 'form-1040'}
                          onClick={() => onSelectForm(form)}
                        />
                      ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Level 1: Tax Summary */}
        <div className={styles.navSection}>
          <NavCategoryHeader
            label="Tax Summary"
            expanded={expandedCategory === 'tax-summary'}
            onToggle={() => toggleCategory('tax-summary')}
          />

          {expandedCategory === 'tax-summary' &&
            TAX_SUMMARY_ITEMS.map(item => (
              <NavSecondaryItem
                key={item.id}
                label={item.label}
                active={contentView === item.id}
                onClick={item.id === 'federal-summary' ? onSelectFederal : onSelectCalifornia}
              />
            ))}
        </div>

        <NavFlatRow
          label="Return Insights"
          onClick={() => navigate('/check-return/insights')}
        />

        {DIAGNOSTIC_NAV_ITEMS.map(item => (
          <NavFlatRow key={item.label} label={item.label} badge={item.badge} />
        ))}

        <NavFlatRow label="Overrides" />
        <NavFlatRow label="Suggestions" isLast />
      </div>
    </nav>
  )
}
