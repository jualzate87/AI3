import { useEffect, useState, ReactNode } from 'react'
import { Close } from '@design-systems/icons'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import {
  INTELLIGENCE_LOADING_STEPS,
  INTELLIGENCE_LOADING_TITLE,
  INTELLIGENCE_PANEL_LABEL,
} from '../agent-review/agentIntelligenceCopy'
import { AgentIntelligenceReasoningLive } from '../agent-review/AgentIntelligenceReasoning'
import styles from '../../styles/data-review/AgentLoadingPane.module.css'

interface AgentLoadingPaneProps {
  onClose?: () => void
  /** True only while agentView === 'loading' — timers start here, not on mount */
  isLoading?: boolean
  /** When true the body crossfades from loading content → report content */
  showReport?: boolean
  /** Whether the whole panel is closing (drives slide-out) */
  closing?: boolean
  /** The report pane to fade in once loading is done */
  reportContent?: ReactNode
  /** Hides header and slide-in animation — used inside Intuit Intelligence shell */
  embedded?: boolean
  loadingTitle?: string
}

const HEADER_DELAY_MS = 150
const STEP_INTERVAL_MS = 800

// Generating content shows the reasoning stream, never a lone spinning mark —
// the mark only turns by itself while the panel is opening.
// Parent keeps isLoading ~3200ms then sets showReport=true.
export default function AgentLoadingPane({
  onClose,
  isLoading = false,
  showReport = false,
  closing = false,
  reportContent,
  embedded = false,
  loadingTitle = INTELLIGENCE_LOADING_TITLE,
}: AgentLoadingPaneProps) {
  const [headerVisible, setHeaderVisible] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState(0)

  useEffect(() => {
    if (!isLoading || showReport) {
      setHeaderVisible(false)
      setVisibleSteps(0)
      return
    }

    const timers = [setTimeout(() => setHeaderVisible(true), HEADER_DELAY_MS)]
    INTELLIGENCE_LOADING_STEPS.forEach((_, index) => {
      timers.push(
        setTimeout(
          () => setVisibleSteps(index + 1),
          HEADER_DELAY_MS + (index + 1) * STEP_INTERVAL_MS,
        ),
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [isLoading, showReport])

  const showLoader = isLoading && !showReport

  return (
    <div className={`${embedded ? styles.panelEmbedded : styles.panel} ${closing && !embedded ? styles.panelClosing : ''}`}>

      {!embedded && (
        <div className={styles.header}>
          <div className={styles.headerLeft} />
          <div className={styles.headerTitle}>
            <img src={intuitIntelligenceLogo} alt="" className={styles.assistIcon} />
            <span className={styles.titleText}>{INTELLIGENCE_PANEL_LABEL}</span>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.iconBtn} aria-label="Close" onClick={onClose}>
              <Close size="small" />
            </button>
          </div>
        </div>
      )}

      <div className={styles.body}>

        {showLoader && (
          <div className={styles.pane} aria-live="polite" aria-busy="true">
            <div className={styles.reasoningColumn}>
              <AgentIntelligenceReasoningLive
                title={loadingTitle}
                steps={INTELLIGENCE_LOADING_STEPS}
                visibleSteps={visibleSteps}
                headerVisible={headerVisible}
                working
              />
            </div>
          </div>
        )}

        {showReport && (
          <div className={styles.reportFadeIn}>
            {reportContent}
          </div>
        )}

      </div>
    </div>
  )
}
