import { Copy, Download, ThumbDown, ThumbUp } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import AgentReviewSuggestionChips, { SuggestionChip } from './AgentReviewSuggestionChips'
import { CTA_REVIEWER_SUMMARY, INTELLIGENCE_COMPLETION_FOOTER } from './agentIntelligenceCopy'
import styles from '../../styles/agent-review/AgentReviewSummaryFooter.module.css'

interface AgentReviewSummaryFooterProps {
  onPrimaryAction: () => void
  primaryLabel?: string
  showPrompt?: boolean
  /**
   * Follow-up suggestions render as a chip; actions that commit the return keep
   * a button so the weight matches the consequence.
   */
  actionVariant?: 'chip' | 'button'
}

export default function AgentReviewSummaryFooter({
  onPrimaryAction,
  primaryLabel = CTA_REVIEWER_SUMMARY,
  showPrompt = true,
  actionVariant = 'chip',
}: AgentReviewSummaryFooterProps) {
  return (
    <div className={styles.footer}>
      {showPrompt ? (
        <p className={styles.footerPrompt}>{INTELLIGENCE_COMPLETION_FOOTER}</p>
      ) : null}

      <div className={styles.controlBar}>
        <IconControl aria-label="Copy" size="small" shape="square">
          <Copy size="small" />
        </IconControl>
        <IconControl aria-label="Download" size="small" shape="square">
          <Download size="small" />
        </IconControl>
        <IconControl aria-label="Like" size="small" shape="square">
          <ThumbUp size="small" />
        </IconControl>
        <IconControl aria-label="Dislike" size="small" shape="square">
          <ThumbDown size="small" />
        </IconControl>
      </div>

      {actionVariant === 'chip' ? (
        <AgentReviewSuggestionChips>
          <SuggestionChip onClick={onPrimaryAction}>{primaryLabel}</SuggestionChip>
        </AgentReviewSuggestionChips>
      ) : (
        <div className={styles.ctaRow}>
          <Button priority="secondary" size="medium" onClick={onPrimaryAction}>
            {primaryLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
