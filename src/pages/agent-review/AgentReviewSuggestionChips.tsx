import type { ReactNode } from 'react'
import {
  SuggestionChip,
  SuggestionChipGroup,
  type Layout,
} from '@genux-ds/suggestion-chip'
import '@genux-ds/suggestion-chip/dist/main.css'
import styles from '../../styles/agent-review/AgentReviewSuggestionChips.module.css'

interface AgentReviewSuggestionChipsProps {
  children: ReactNode
  layout?: Layout
  className?: string
}

/** Intuit Assist response chips — blue outline pills per GenUX spec. */
export default function AgentReviewSuggestionChips({
  children,
  layout = 'row',
  className,
}: AgentReviewSuggestionChipsProps) {
  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <SuggestionChipGroup layout={layout} alignment="right" animate>
        {children}
      </SuggestionChipGroup>
    </div>
  )
}

export { SuggestionChip }
