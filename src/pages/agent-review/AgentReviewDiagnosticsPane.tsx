import { useMemo, useState } from 'react'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import AgentDiagnosticExpandableCard from '../check-return/AgentDiagnosticExpandableCard'
import {
  buildIntelligenceReviewModel,
  CTA_ACCEPT_ALL_FIXES,
  CTA_FIX_ONE_BY_ONE,
  getActiveIntelligenceIssues,
  INTELLIGENCE_SHELL_TITLE,
  intelligenceIntro,
} from './agentIntelligenceCopy'
import AgentReviewSuggestionChips, { SuggestionChip } from './AgentReviewSuggestionChips'
import { SEED_AMOUNTS } from '../../data/liveReturn'
import type { Phase2IssueKey } from '../data-review/phase2FlagSync'
import styles from '../../styles/agent-review/AgentReviewDiagnosticsPane.module.css'

export type DiagnosticCardId = Phase2IssueKey

interface AgentReviewDiagnosticsPaneProps {
  onAcceptAllFixes: () => void
  onFixOneByOne: () => void
}

export default function AgentReviewDiagnosticsPane({
  onAcceptAllFixes,
  onFixOneByOne,
}: AgentReviewDiagnosticsPaneProps) {
  const [expandedId, setExpandedId] = useState<DiagnosticCardId | null>(null)

  const { issues, issueCount, totalWithholding, live } = useMemo(
    () => getActiveIntelligenceIssues(),
    [],
  )

  const reviewCards = useMemo(
    () =>
      issues.map(issue =>
        buildIntelligenceReviewModel(issue, live, SEED_AMOUNTS, totalWithholding),
      ),
    [issues, live, totalWithholding],
  )

  const handleToggle = (issueKey: Phase2IssueKey, nextExpanded: boolean) => {
    setExpandedId(nextExpanded ? issueKey : null)
  }

  return (
    <div className={styles.container}>
      <div className={styles.scrollArea}>
        <div className={styles.content}>
          <div className={styles.lockup}>
            <img src={intuitIntelligenceLogo} alt="" className={styles.sparkleIcon} />
            <h1 className={styles.title}>{INTELLIGENCE_SHELL_TITLE}</h1>
          </div>

          <p className={styles.intro}>{intelligenceIntro(issueCount)}</p>

          <div className={styles.cardList} role="list" aria-label="Diagnostic issues">
            {reviewCards.map(card => (
              <AgentDiagnosticExpandableCard
                key={card.id}
                card={card}
                expanded={expandedId === card.issueKey}
                onExpandedChange={next =>
                  card.issueKey && handleToggle(card.issueKey, next)
                }
              />
            ))}
          </div>

          {issueCount > 0 ? (
            <AgentReviewSuggestionChips className={styles.suggestionChips}>
              <SuggestionChip onClick={onAcceptAllFixes}>{CTA_ACCEPT_ALL_FIXES}</SuggestionChip>
              <SuggestionChip onClick={onFixOneByOne}>{CTA_FIX_ONE_BY_ONE}</SuggestionChip>
            </AgentReviewSuggestionChips>
          ) : null}
        </div>
      </div>
    </div>
  )
}
