import { ChevronDown } from '@design-systems/icons'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { CTA_SHOW_THINKING } from './agentIntelligenceCopy'
import styles from '../../styles/agent-review/AgentReviewProcessingPane.module.css'

export type IntelligenceReasoningStep = {
  title: string
  body: string
}

interface AgentIntelligenceReasoningLiveProps {
  title: string
  steps: readonly IntelligenceReasoningStep[]
  visibleSteps: number
  headerVisible: boolean
  exiting?: boolean
  /** Spins the Intuit Intelligence mark while activities are still streaming in. */
  working?: boolean
}

/**
 * Vertical progress tracker for the agent's reasoning stream — a connector rail
 * with a node per activity, shared by the processing and catch-up panes.
 */
function ReasoningTimeline({
  steps,
  visibleSteps,
  stagger,
}: {
  steps: readonly IntelligenceReasoningStep[]
  visibleSteps: number
  stagger: number
}) {
  return (
    <ol className={styles.reasoningSteps}>
      {steps.map((step, index) => (
        <li
          key={step.title}
          className={`${styles.reasoningStep} ${index < visibleSteps ? styles.revealIn : styles.revealHidden}`}
          style={{ animationDelay: `${index * stagger}ms` }}
        >
          <span className={styles.reasoningStepRail} aria-hidden />
          <div className={styles.reasoningStepContent}>
            <span className={styles.reasoningStepTitle}>{step.title}</span>
            <p className={styles.reasoningStepBody}>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Live reasoning stream — shared by processing and catch-up panes. */
export function AgentIntelligenceReasoningLive({
  title,
  steps,
  visibleSteps,
  headerVisible,
  exiting = false,
  working = false,
}: AgentIntelligenceReasoningLiveProps) {
  return (
    <div className={`${styles.reasoningBlock} ${exiting ? styles.revealOut : ''}`}>
      <div
        className={`${styles.reasoningHeader} ${headerVisible ? styles.revealIn : styles.revealHidden}`}
      >
        <img
          src={intuitIntelligenceLogo}
          alt=""
          className={`${styles.reasoningSparkle} ${working ? styles.reasoningSparkleWorking : ''}`}
        />
        <span className={styles.reasoningTitle}>{title}</span>
      </div>
      <ReasoningTimeline steps={steps} visibleSteps={visibleSteps} stagger={80} />
    </div>
  )
}

interface AgentIntelligenceShowThinkingProps {
  expanded: boolean
  onToggle: () => void
  steps: readonly IntelligenceReasoningStep[]
  label?: string
}

/** Collapsed reasoning replay — shared Show thinking control. */
export function AgentIntelligenceShowThinking({
  expanded,
  onToggle,
  steps,
  label = CTA_SHOW_THINKING,
}: AgentIntelligenceShowThinkingProps) {
  return (
    <>
      <button
        type="button"
        className={styles.showThinkingBtn}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        {label}
        <ChevronDown
          size="small"
          className={`${styles.chevron} ${expanded ? styles.chevronUp : ''}`}
        />
      </button>
      {expanded && (
        <ReasoningTimeline steps={steps} visibleSteps={steps.length} stagger={100} />
      )}
    </>
  )
}
