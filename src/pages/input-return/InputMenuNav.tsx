import { ChevronLeft, ChevronRight, Search } from '@design-systems/icons'
import { useNavigate } from 'react-router-dom'
import {
  INPUT_NAV_CATEGORIES,
  type InputNavItemId,
} from '../../data/inputMenuNav'
import { getInputDocTabs } from '../../data/inputDocTabs'
import styles from '../../styles/InputReturnPage.module.css'

interface InputMenuNavProps {
  activeItemId: InputNavItemId
  activeDocKey: string | null
  onSelect: (id: InputNavItemId) => void
  onDocSelect: (docKey: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export default function InputMenuNav({
  activeItemId,
  activeDocKey,
  onSelect,
  onDocSelect,
  searchQuery,
  onSearchChange,
  collapsed,
  onCollapsedChange,
}: InputMenuNavProps) {
  const navigate = useNavigate()
  const normalizedSearch = searchQuery.trim().toLowerCase()

  if (collapsed) {
    return (
      <aside className={styles.menuPanelCollapsed} aria-label="Input menu">
        <button
          type="button"
          className={styles.menuCollapseBtn}
          aria-label="Expand input menu"
          onClick={() => onCollapsedChange(false)}
        >
          <ChevronLeft size="small" aria-hidden />
        </button>
      </aside>
    )
  }

  return (
    <aside className={styles.menuPanel} aria-label="Input menu">
      <div className={styles.menuHeader}>
        <span className={styles.menuTitle}>Input menu</span>
        <button
          type="button"
          className={styles.menuCollapseBtn}
          aria-label="Collapse input menu"
          onClick={() => onCollapsedChange(true)}
        >
          <ChevronLeft size="small" aria-hidden />
        </button>
      </div>

      <div className={styles.modeSwitch} role="tablist" aria-label="Input or review">
        <span className={`${styles.modeSegment} ${styles.modeSegmentActive}`} role="tab" aria-selected>
          Input
        </span>
        <button
          type="button"
          className={styles.modeSegment}
          role="tab"
          aria-selected={false}
          onClick={() => navigate('/data-review')}
        >
          Review
        </button>
      </div>

      <label className={styles.searchWrap}>
        <span className={styles.visuallyHidden}>Search input menu</span>
        <Search size="small" className={styles.searchIcon} aria-hidden />
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </label>

      <nav className={styles.menuNavScroll}>
        {INPUT_NAV_CATEGORIES.map((category, catIndex) => {
          const visibleItems = category.items.filter(item =>
            !normalizedSearch || item.label.toLowerCase().includes(normalizedSearch),
          )
          const isLastCategory = catIndex === INPUT_NAV_CATEGORIES.length - 1

          if (category.disabled && !normalizedSearch) {
            return (
              <div
                key={category.id}
                className={`${styles.navCategory} ${isLastCategory ? styles.navCategoryLast : ''}`}
                aria-disabled
              >
                <span className={styles.navCategoryLabel}>{category.label}</span>
              </div>
            )
          }
          if (visibleItems.length === 0) return null

          return (
            <div key={category.id} className={styles.navCategoryGroup}>
              <div
                className={`${styles.navCategory} ${isLastCategory && visibleItems.length === 0 ? styles.navCategoryLast : ''}`}
              >
                <span className={styles.navCategoryLabel}>{category.label}</span>
              </div>
              {visibleItems.map((item, itemIndex) => {
                const isActive = activeItemId === item.id
                const docTabs = getInputDocTabs(item.topTab)
                const isLastItem =
                  isLastCategory && itemIndex === visibleItems.length - 1 && docTabs.length === 0

                return (
                  <div key={item.id} className={styles.navItemGroup}>
                    <button
                      type="button"
                      className={[
                        styles.navPrimary,
                        isActive ? styles.navPrimaryActive : '',
                        isLastItem ? styles.navRowLast : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => onSelect(item.id)}
                    >
                      <span className={styles.navPrimaryLabel}>{item.label}</span>
                      {isActive && docTabs.length > 0 && (
                        <ChevronRight size="small" className={styles.navPrimaryChevron} aria-hidden />
                      )}
                    </button>
                    {isActive &&
                      docTabs.length > 0 &&
                      docTabs.map((doc, docIndex) => {
                        const docActive = activeDocKey === doc.key
                        const isLastDoc = isLastItem && docIndex === docTabs.length - 1
                        return (
                          <button
                            key={doc.key}
                            type="button"
                            className={[
                              styles.navSecondary,
                              docActive ? styles.navSecondaryActive : '',
                              isLastDoc ? styles.navRowLast : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => onDocSelect(doc.key)}
                          >
                            <span className={styles.navSecondaryLabel}>{doc.label}</span>
                          </button>
                        )
                      })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
