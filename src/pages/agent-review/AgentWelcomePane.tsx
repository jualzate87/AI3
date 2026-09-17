import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import {
  STARTER_PROMPTS,
  WELCOME_GREETING_NAME,
  WELCOME_GREETING_PROMPT,
} from './agentIntelligenceCopy'
import styles from '../../styles/agent-review/AgentWelcomePane.module.css'

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
  return (
    <div className={`${styles.container} ${compact ? styles.containerCompact : ''}`}>
      <div className={styles.logoWrapper}>
        <img src={intuitIntelligenceLogo} alt="" className={styles.logoGif} />
      </div>

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
    </div>
  )
}
