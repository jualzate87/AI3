import { useId } from 'react'
import styles from '../../styles/data-review/LeftNavPTO.module.css'

function ProConnectLogo() {
  const clipId = useId()

  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.logoImg}
      role="img"
      aria-label="Intuit ProConnect"
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M13 0C5.82969 0 0 5.82969 0 13C0 20.1703 5.82969 26 13 26C20.1703 26 26 20.1703 26 13C26 5.82969 20.1703 0 13 0ZM7.15 16.8391C6.825 16.5141 6.825 16.0062 7.15 15.6812L14.3 8.53125H8.59219C8.14531 8.53125 7.77969 8.16562 7.77969 7.71875V6.90625H16.25C16.9813 6.90625 17.3266 7.77969 16.8188 8.2875L7.71875 17.4078L7.15 16.8391ZM19.0938 18.2406H18.2812C17.8344 18.2406 17.4688 17.875 17.4688 17.4281V11.7L10.3187 18.85C9.99375 19.175 9.48594 19.175 9.16094 18.85L8.59219 18.2812L17.6922 9.18125C18.2 8.67344 19.0734 9.03906 19.0734 9.75V18.2406H19.0938Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="26" height="26" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  active?: boolean
  label?: string
}

function NavItem({ icon, active = false, label }: NavItemProps) {
  return (
    <div className={`${styles.navItem} ${active ? styles.navItemActive : ''}`} title={label}>
      {active && <div className={styles.activeBar} />}
      <span className={styles.navIconWrap}>{icon}</span>
    </div>
  )
}

function Divider() {
  return <div className={styles.divider} />
}

export default function LeftNavPTO() {
  return (
    <div className={styles.nav}>
      {/* Logo */}
      <div className={styles.logo}>
        <ProConnectLogo />
      </div>

      {/* Nav links */}
      <div className={styles.navLinks}>
        {/* Welcome */}
        <NavItem label="Welcome" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L3 8v9h5v-5h4v5h5V8L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        } />

        {/* Tax Returns — active */}
        <NavItem label="Tax Returns" active icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M6 6h8M6 9.5h8M6 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        } />

        {/* Clients */}
        <NavItem label="Clients" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        } />

        {/* E-File Dashboard */}
        <NavItem label="E-File Dashboard" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5 10h10M5 7h6M5 13h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M14 12l2 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        } />

        {/* Intuit Link */}
        <NavItem label="Intuit Link" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8 10a4 4 0 0 1 6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M7 7.5A6 6 0 0 1 17 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M5 5A9 9 0 0 1 18 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="5" cy="14" r="1.5" fill="currentColor"/>
          </svg>
        } />

        <Divider />

        {/* Tax Advisor */}
        <NavItem label="Tax Advisor" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2l1.8 5.4H17l-4.5 3.3 1.7 5.3L10 13l-4.2 3 1.7-5.3L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        } />

        {/* QB Accountant */}
        <NavItem label="QB Accountant" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M7.5 7.5C7.5 6.12 8.62 5 10 5s2.5 1.12 2.5 2.5c0 1.38-1.12 2.5-2.5 2.5v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="10" cy="14.5" r="0.8" fill="currentColor"/>
          </svg>
        } />

        {/* All Solutions */}
        <NavItem label="All Solutions" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
        } />
      </div>

      <Divider />

      {/* Purchase */}
      <NavItem label="Purchase" icon={
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 4h2l2.4 8.4a1 1 0 0 0 .96.7h6.8a1 1 0 0 0 .96-.73L17 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8.5" cy="16" r="1.2" fill="currentColor"/>
          <circle cx="15.5" cy="16" r="1.2" fill="currentColor"/>
        </svg>
      } />

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* Bottom nav */}
      <div className={styles.bottomNav}>
        <Divider />
        {/* Collapse */}
        <NavItem label="Collapse" icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        } />
      </div>
    </div>
  )
}
