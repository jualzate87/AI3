import type { ComponentType } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CircleZap,
  Clipboard,
  ClipboardFileBox,
  CommentDots,
  Flag,
  ViewList,
} from '@design-systems/icons'
import type { IconProps } from '@design-systems/icons'
import styles from '../styles/ReturnContextRail.module.css'

export type ReturnContextRailItemId =
  | 'tax-organizer'
  | 'import-hub'
  | 'documents-list'
  | 'activity'
  | 'flagged-items'
  | 'comments'

type RailIcon = ComponentType<IconProps>

type RailItem = {
  id: ReturnContextRailItemId
  Icon: RailIcon
  label: ReactNode
  route?: string
  showNewBadge?: boolean
}

const RAIL_ITEMS: RailItem[] = [
  { id: 'tax-organizer', Icon: Clipboard, label: <>Tax<br />Organizer</> },
  { id: 'import-hub', Icon: CircleZap, label: <>Import<br />hub</>, route: '/smart-return' },
  {
    id: 'documents-list',
    Icon: ClipboardFileBox,
    label: <>Documents<br />list</>,
    route: '/smart-return',
  },
  {
    id: 'activity',
    Icon: ViewList,
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

/** Right-edge icon rail — Megafirms Figma node 2602:54845 */
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
        <div className={styles.iconLabelGroup}>
          <span className={styles.iconSlot}>
            <Icon size="medium" aria-hidden />
          </span>
          <span className={styles.label}>{item.label}</span>
        </div>
        {item.showNewBadge ? (
          <span className={styles.newBadge} aria-label="New">
            NEW
          </span>
        ) : null}
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
