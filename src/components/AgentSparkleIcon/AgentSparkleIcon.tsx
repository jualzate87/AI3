import sparklesIcon from '../../assets/icons/sparkles.svg'
import styles from './AgentSparkleIcon.module.css'

type AgentSparkleSize = 'inline' | 'medium'

const sizeClass: Record<AgentSparkleSize, string> = {
  inline: styles.sizeInline,
  medium: styles.sizeMedium,
}

/** Filled blue Intuit AI sparkle — unified across agent secondary/done states. */
export default function AgentSparkleIcon({
  size = 'inline',
  className,
}: {
  size?: AgentSparkleSize
  className?: string
}) {
  return (
    <img
      src={sparklesIcon}
      alt=""
      className={[styles.icon, sizeClass[size], className].filter(Boolean).join(' ')}
      aria-hidden
    />
  )
}
