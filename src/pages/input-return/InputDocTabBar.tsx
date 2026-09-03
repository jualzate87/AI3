import { ChevronDown, Close, Menu, Plus } from '@design-systems/icons'
import styles from '../../styles/data-review/DetailFields.module.css'

export type InputDocTabItem = { key: string; label: string }

interface InputDocTabBarProps {
  tabs: InputDocTabItem[]
  activeKey: string
  onChange: (key: string) => void
}

export default function InputDocTabBar({ tabs, activeKey, onChange }: InputDocTabBarProps) {
  if (tabs.length === 0) return null

  return (
    <div className={styles.subTabBar}>
      <button type="button" className={styles.subTabMenu} aria-label="Document menu">
        <Menu size="medium" />
      </button>
      {tabs.map(tab => {
        const isActive = tab.key === activeKey
        return (
          <div
            key={tab.key}
            className={[styles.subTab, isActive ? styles.subTabActive : ''].filter(Boolean).join(' ')}
          >
            <button
              type="button"
              className={styles.subTabContent}
              onClick={() => onChange(tab.key)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={[
                  styles.subTabLabel,
                  isActive ? styles.subTabLabelActive : styles.subTabLabelInactive,
                ].join(' ')}
              >
                {tab.label}
              </span>
              <Close className={styles.subTabClose} size="small" aria-hidden />
            </button>
          </div>
        )
      })}
      <div className={styles.subTabBorderFill} aria-hidden />
      <div className={styles.subTabActions}>
        <button type="button" className={styles.subTabAddBtn} aria-label="Add document">
          <Plus size="medium" />
        </button>
        <button type="button" className={styles.subTabViewAll}>
          View All
          <ChevronDown size="medium" />
        </button>
      </div>
    </div>
  )
}
