import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CommentDots, Flag } from '@design-systems/icons'
import sidebarTaxOrganizerIcon from '../assets/icons/sidebar-tax-organizer.svg'
import sidebarImportHubIcon from '../assets/icons/sidebar-import-hub.svg'
import sidebarDocumentsListIcon from '../assets/icons/sidebar-documents-list.svg'
import sidebarClientActivityIcon from '../assets/icons/sidebar-client-activity.svg'
import styles from '../styles/ReturnContextRail.module.css'

export type ReturnContextRailItemId =
  | 'tax-organizer'
  | 'import-hub'
  | 'documents-list'
  | 'activity'
  | 'flagged-items'
  | 'comments'

type IconComponent = typeof CommentDots

type RailItem = {
  id: ReturnContextRailItemId
  iconSrc?: string
  Icon?: IconComponent
  label: ReactNode
  route?: string
  showNewBadge?: boolean
}

const RAIL_ITEMS: RailItem[] = [
  { id: 'tax-organizer', iconSrc: sidebarTaxOrganizerIcon, label: <>Tax<br />Organizer</> },
  { id: 'import-hub', iconSrc: sidebarImportHubIcon, label: <>Import<br />hub</>, route: '/smart-return' },
  { id: 'documents-list', iconSrc: sidebarDocumentsListIcon, label: <>Documents<br />list</>, route: '/smart-return' },
  {
    id: 'activity',
    iconSrc: sidebarClientActivityIcon,
    label: <>Activity<br />feed</>,
    showNewBadge: true,
  },
]

const RAIL_ITEMS_SECONDARY: RailItem[] = [
  {
    id: 'flagged-items',
    Icon: Flag,
    label: <>Flagged<br />items</>,
    route: '/data-review?entry=input-return&role=preparer',
  },
  {
    id: 'comments',
    Icon: CommentDots,
    label: 'Comments',
    route: '/data-review?entry=input-return&role=preparer',
  },
]

type ReturnContextRailProps = {
  activeItem?: ReturnContextRailItemId
  className?: string
  /** When set, non-route items (e.g. client activity) invoke this instead of being inert. */
  onItemClick?: (id: ReturnContextRailItemId) => void
}

/** Right-edge icon rail - Tax Organizer, Import hub, Documents, etc. */
export default function ReturnContextRail({
  activeItem,
  className,
  onItemClick,
}: ReturnContextRailProps) {
  const navigate = useNavigate()

  const renderItem = (item: RailItem) => {
    const isActive = activeItem === item.id
    const isClickable = Boolean(item.route || onItemClick)
    const Tag = isClickable ? 'button' : 'div'
    const Icon = item.Icon

    const handleClick = () => {
      if (item.route) {
        navigate(item.route)
        return
      }
      onItemClick?.(item.id)
    }

    return (
      <Tag
        key={item.id}
        type={isClickable ? 'button' : undefined}
        className={[styles.item, isActive ? styles.itemActive : ''].filter(Boolean).join(' ')}
        aria-label={typeof item.label === 'string' ? item.label : item.id.replace('-', ' ')}
        aria-current={isActive ? 'page' : undefined}
        aria-pressed={onItemClick && !item.route ? isActive : undefined}
        onClick={isClickable ? handleClick : undefined}
      >
        <span className={styles.iconWrap}>
          {Icon ? (
            <Icon size="small" className={styles.idsIcon} aria-hidden />
          ) : (
            <img src={item.iconSrc} alt="" className={styles.icon} />
          )}
          {item.showNewBadge ? (
            <span className={styles.newBadge} aria-label="New">
              NEW
            </span>
          ) : null}
        </span>
        <span>{item.label}</span>
      </Tag>
    )
  }

  return (
    <nav
      className={[styles.rail, className].filter(Boolean).join(' ')}
      aria-label="Return context"
    >
      {RAIL_ITEMS.map(renderItem)}
      <div className={styles.divider} role="presentation" />
      {RAIL_ITEMS_SECONDARY.map(renderItem)}
    </nav>
  )
}
