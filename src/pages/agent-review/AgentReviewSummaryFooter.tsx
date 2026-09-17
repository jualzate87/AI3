import { Copy, Download, ThumbDown, ThumbUp } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { INTELLIGENCE_COMPLETION_FOOTER, STARTER_PROMPT_CATCH_UP } from './agentIntelligenceCopy'
import styles from '../../styles/agent-review/AgentReviewSummaryFooter.module.css'

interface AgentReviewSummaryFooterProps {
  onPrimaryAction: () => void
  primaryLabel?: string
  showPrompt?: boolean
}

export default function AgentReviewSummaryFooter({
  onPrimaryAction,
  primaryLabel = STARTER_PROMPT_CATCH_UP,
  showPrompt = true,
}: AgentReviewSummaryFooterProps) {
  return (
    <div className={styles.footer}>
      {showPrompt ? (
        <p className={styles.footerPrompt}>{INTELLIGENCE_COMPLETION_FOOTER}</p>
      ) : null}

      <div className={styles.controlBar}>
        <button type="button" className={styles.iconBtn} aria-label="Copy">
          <Copy size="small" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Download">
          <Download size="small" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Like">
          <ThumbUp size="small" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Dislike">
          <ThumbDown size="small" />
        </button>
      </div>

      <div className={styles.ctaRow}>
        <Button priority="secondary" size="medium" onClick={onPrimaryAction}>
          {primaryLabel}
        </Button>
      </div>
    </div>
  )
}
