import ptgLogo from '../../assets/icons/ptg-logo.svg'
import navWelcome from '../../assets/icons/nav/nav-welcome.svg'
import navTaxReturns from '../../assets/icons/nav/nav-tax-returns.svg'
import navClients from '../../assets/icons/nav/nav-clients.svg'
import navEfile from '../../assets/icons/nav/nav-efile.svg'
import navIntuitLink from '../../assets/icons/nav/nav-intuit-link.svg'
import navReporting from '../../assets/icons/nav/nav-reporting.svg'
import navTaxAdvisor from '../../assets/icons/nav/nav-tax-advisor.svg'
import navQbAccountant from '../../assets/icons/nav/nav-qb-accountant.svg'
import navAllSolutions from '../../assets/icons/nav/nav-all-solutions.svg'
import navPurchase from '../../assets/icons/nav/nav-purchase.svg'
import navCollapse from '../../assets/icons/nav/nav-collapse.svg'
import styles from '../../styles/data-review/LeftNavPTO.module.css'

type NavItemId =
  | 'welcome'
  | 'tax-returns'
  | 'clients'
  | 'efile'
  | 'intuit-link'
  | 'reporting'
  | 'tax-advisor'
  | 'qb-accountant'
  | 'all-solutions'
  | 'purchase'

interface LeftNavPTOProps {
  activeItem?: NavItemId
}

interface NavItemProps {
  icon: string
  label: string
  active?: boolean
}

function NavItem({ icon, label, active = false }: NavItemProps) {
  return (
    <div className={`${styles.navItem} ${active ? styles.navItemActive : ''}`} title={label}>
      {active && <div className={styles.activeBar} />}
      <span className={styles.navIconWrap}>
        <img src={icon} alt="" className={styles.navIcon} />
      </span>
    </div>
  )
}

function Divider() {
  return <div className={styles.divider} />
}

export default function LeftNavPTO({ activeItem = 'tax-returns' }: LeftNavPTOProps) {
  return (
    <div className={styles.nav}>
      <div className={styles.logo}>
        <img src={ptgLogo} alt="Intuit ProConnect" className={styles.logoImg} />
      </div>

      <div className={styles.navLinks}>
        <NavItem icon={navWelcome} label="Welcome" active={activeItem === 'welcome'} />
        <NavItem
          icon={navTaxReturns}
          label="Tax returns"
          active={activeItem === 'tax-returns'}
        />
        <NavItem icon={navClients} label="Clients" active={activeItem === 'clients'} />
        <NavItem icon={navEfile} label="E-File Dashboard" active={activeItem === 'efile'} />
        <NavItem icon={navIntuitLink} label="Intuit Link" active={activeItem === 'intuit-link'} />
        <NavItem icon={navReporting} label="Reporting" active={activeItem === 'reporting'} />

        <Divider />

        <NavItem
          icon={navTaxAdvisor}
          label="Tax Advisor"
          active={activeItem === 'tax-advisor'}
        />
        <NavItem
          icon={navQbAccountant}
          label="QB Accountant"
          active={activeItem === 'qb-accountant'}
        />
        <NavItem
          icon={navAllSolutions}
          label="All solutions"
          active={activeItem === 'all-solutions'}
        />
      </div>

      <Divider />

      <NavItem icon={navPurchase} label="Purchase" active={activeItem === 'purchase'} />

      <div className={styles.spacer} />

      <div className={styles.bottomNav}>
        <Divider />
        <NavItem icon={navCollapse} label="Collapse" />
      </div>
    </div>
  )
}
