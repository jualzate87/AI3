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
  | 'client-activity'
  | 'flagged-items'
  | 'comments'

type IconComponent = typeof CommentDots

type RailItem = {
  id: ReturnContextRailItemId
  iconSrc?: string
  Icon?: IconComponent
  label: ReactNode
  route?: string
}

const RAIL_ITEMS: RailItem[] = [
  { id: 'tax-organizer', iconSrc: sidebarTaxOrganizerIcon, label: <>Tax<br />Organizer</> },
  { id: 'import-hub', iconSrc: sidebarImportHubIcon, label: <>Import<br />hub</>, route: '/smart-return' },
  { id: 'documents-list', iconSrc: sidebarDocumentsListIcon, label: <>Documents<br />list</>, route: '/smart-return' },
  { id: 'client-activity', iconSrc: sidebarClientActivityIcon, label: <>Client<br />activity</> },
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
}

/** Right-edge icon rail - Tax Organizer, Import hub, Documents, etc. */
export default function ReturnContextRail({ activeItem, className }: ReturnContextRailProps) {
  const navigate = useNavigate()

  const renderItem = (item: RailItem) => {
    const isActive = activeItem === item.id
    const Tag = item.route ? 'button' : 'div'
    const Icon = item.Icon
    return (
      <Tag
        key={item.id}
        type={item.route ? 'button' : undefined}
        className={[styles.item, isActive ? styles.itemActive : ''].filter(Boolean).join(' ')}
        aria-label={typeof item.label === 'string' ? item.label : item.id.replace('-', ' ')}
        aria-current={isActive ? 'page' : undefined}
        onClick={item.route ? () => navigate(item.route!) : undefined}
      >
        {Icon ? (
          <Icon size="medium" className={styles.idsIcon} aria-hidden />
        ) : (
          <img src={item.iconSrc} alt="" className={styles.icon} />
        )}
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
