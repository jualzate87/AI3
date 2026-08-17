import { ChevronLeft } from '@design-systems/icons'
import { useNavigate } from 'react-router-dom'
import {
  INPUT_NAV_CATEGORIES,
  type InputNavItemId,
} from '../../data/inputMenuNav'
import navStyles from '../../styles/CheckReturnPage.module.css'
import styles from '../../styles/InputReturnPage.module.css'

interface InputMenuNavProps {
  activeItemId: InputNavItemId
  onSelect: (id: InputNavItemId) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function InputMenuNav({
  activeItemId,
  onSelect,
  searchQuery,
  onSearchChange,
}: InputMenuNavProps) {
  const navigate = useNavigate()
  const normalizedSearch = searchQuery.trim().toLowerCase()

  return (
    <aside className={styles.menuPanel} aria-label="Input menu">
      <div className={styles.menuHeader}>
        <span className={styles.menuTitle}>Input menu</span>
        <button
          type="button"
          className={styles.menuBackBtn}
          aria-label="Back to import confirmation"
          onClick={() => navigate('/import-confirmation')}
        >
          <ChevronLeft size="small" />
        </button>
      </div>

      <div className={styles.menuTabs} role="tablist" aria-label="Federal or state">
        <span className={`${styles.menuTab} ${styles.menuTabActive}`} role="tab" aria-selected>
          Federal
        </span>
        <span className={styles.menuTab} role="tab" aria-selected={false}>
          State
        </span>
      </div>

      <label className={styles.searchWrap}>
        <span className={styles.visuallyHidden}>Search input menu</span>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </label>

      <nav className={navStyles.leftNav}>
        {INPUT_NAV_CATEGORIES.map(category => {
          const visibleItems = category.items.filter(item =>
            !normalizedSearch || item.label.toLowerCase().includes(normalizedSearch),
          )
          if (category.disabled && !normalizedSearch) {
            return (
              <div
                key={category.id}
                className={`${navStyles.navCategory} ${styles.navCategoryDisabled}`}
                aria-disabled
              >
                <span className={navStyles.navCategoryLabel}>{category.label}</span>
                <span className={styles.comingSoon}>Prototype</span>
              </div>
            )
          }
          if (visibleItems.length === 0) return null

          return (
            <div key={category.id}>
              <div className={navStyles.navCategory}>
                <span className={navStyles.navCategoryLabel}>{category.label}</span>
              </div>
              {visibleItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`${navStyles.navSecondary} ${activeItemId === item.id ? navStyles.navSecondaryActive : ''}`}
                  onClick={() => onSelect(item.id)}
                >
                  <span className={navStyles.navSecondaryLabel}>{item.label}</span>
                </button>
              ))}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
