import { useEffect, useState } from 'react'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import {
  STARTER_PROMPTS,
  WELCOME_GREETING_NAME,
  WELCOME_GREETING_PROMPT,
} from './agentIntelligenceCopy'
import styles from '../../styles/agent-review/AgentWelcomePane.module.css'

/** How long the mark spins on its own before the greeting arrives. */
const SPIN_ONLY_MS = 900

interface AgentWelcomePaneProps {
  preparerName?: string
  compact?: boolean
  onPromptClick: (prompt: string) => void
}

export default function AgentWelcomePane({
  preparerName = WELCOME_GREETING_NAME,
  compact = false,
  onPromptClick,
}: AgentWelcomePaneProps) {
  const [greeted, setGreeted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setGreeted(true), SPIN_ONLY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`${styles.container} ${compact ? styles.containerCompact : ''}`}>
      <div className={`${styles.logoWrapper} ${greeted ? '' : styles.logoWrapperSpinning}`}>
        <img src={intuitIntelligenceLogo} alt="" className={styles.logoGif} />
      </div>

      {greeted && (
        <>
          <div className={styles.greeting}>
            <span className={styles.greetingName}>Hi, {preparerName}</span>
            <span className={styles.greetingSubtitle}>{WELCOME_GREETING_PROMPT}</span>
          </div>

          <div className={styles.promptsRow}>
            {STARTER_PROMPTS.map(prompt => (
              <button
                key={prompt}
                type="button"
                className={styles.prompt}
                onClick={() => onPromptClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
