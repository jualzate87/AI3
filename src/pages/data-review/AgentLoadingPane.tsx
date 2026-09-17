import { useEffect, useState, ReactNode } from 'react'
import { Close } from '@design-systems/icons'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import {
  INTELLIGENCE_LOADING_SUBTEXT,
  INTELLIGENCE_LOADING_TITLE,
  INTELLIGENCE_PANEL_LABEL,
} from '../agent-review/agentIntelligenceCopy'
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
  loadingSubtext?: string
}

// Loading phases (timers only run while isLoading — not while idle/mounted):
//   'spinning'  0–700ms    — centered rotating Intuit Assist icon
//   'greeting'  700–2400ms — icon + "Assessing the return…" + subtext
//   'exiting'   2400ms+    — message fades out
// Parent keeps isLoading ~3200ms then sets showReport=true
export default function AgentLoadingPane({
  onClose,
  isLoading = false,
  showReport = false,
  closing = false,
  reportContent,
  embedded = false,
  loadingTitle = INTELLIGENCE_LOADING_TITLE,
  loadingSubtext = INTELLIGENCE_LOADING_SUBTEXT,
}: AgentLoadingPaneProps) {
  const [phase, setPhase] = useState<'spinning' | 'greeting' | 'exiting'>('spinning')

  useEffect(() => {
    if (!isLoading || showReport) return
    setPhase('spinning')
    const greetTimer = setTimeout(() => setPhase('greeting'), 700)
    const exitTimer = setTimeout(() => setPhase('exiting'), 2400)
    return () => {
      clearTimeout(greetTimer)
      clearTimeout(exitTimer)
    }
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
            {phase === 'spinning' && (
              <div className={styles.spinOnlyPhase}>
                <div className={styles.spinningIcon}>
                  <img
                    src={intuitIntelligenceLogo}
                    alt="Intuit Intelligence is reviewing the return"
                    className={styles.greetingIconImg}
                  />
                </div>
              </div>
            )}

            {(phase === 'greeting' || phase === 'exiting') && (
              <div className={phase === 'exiting' ? styles.greetingExiting : styles.greetingPhase}>
                <div className={styles.spinningIcon}>
                  <img src={intuitIntelligenceLogo} alt="" className={styles.greetingIconImg} />
                </div>
                <div className={styles.greetingText}>
                  <h2 className={styles.greetingTitle}>{loadingTitle}</h2>
                  <p className={styles.greetingSubtext}>{loadingSubtext}</p>
                </div>
              </div>
            )}
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
