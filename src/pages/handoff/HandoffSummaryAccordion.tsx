import { Badge, SuccessBadgeIcon, WarningBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import {
  Accordion,
  AccordionItem,
  AccordionItemHeader,
  AccordionItemBody,
} from '@ids-ts/accordion'
import '@ids-ts/accordion/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import type { HandoffSummarySection } from '../../lib/returnWorkflow'
import styles from '../../styles/handoff/HandoffSummaryAccordion.module.css'

interface HandoffSummaryAccordionProps {
  label: string
  sections: HandoffSummarySection[]
}

export default function HandoffSummaryAccordion({
  label,
  sections,
}: HandoffSummaryAccordionProps) {
  return (
    <div className={styles.summaryPanel}>
      <Accordion variant="text" size="small" allowZeroExpanded chevronPosition="right">
        <AccordionItem id="handoff-summary" defaultExpanded={false}>
          <AccordionItemHeader className={styles.summaryHeader}>
            <span className={styles.summaryHeaderLabel}>
              <img src={intuitIntelligenceLogo} alt="" className={styles.sparkle} />
              {label}
            </span>
          </AccordionItemHeader>
          <AccordionItemBody>
            <div className={styles.sections}>
              {sections.map(section => (
                <section key={section.id} className={styles.section}>
                  <div className={styles.sectionHeader}>
                    {section.id === 'heads-up' ? (
                      <Badge shape="round" status="warning" aria-label="Needs attention">
                        <WarningBadgeIcon />
                      </Badge>
                    ) : (
                      <Badge shape="round" status="success" aria-label="Ready">
                        <SuccessBadgeIcon />
                      </Badge>
                    )}
                    <h4 className={styles.sectionTitle}>{section.title}</h4>
                  </div>
                  <p className={styles.sectionIntro}>{section.intro}</p>
                  <ul className={styles.itemList}>
                    {section.items.map(item => (
                      <li key={item.title} className={styles.item}>
                        <span className={styles.itemTitle}>{item.title}</span>
                        <span className={styles.itemDetail}>{item.detail}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </AccordionItemBody>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
