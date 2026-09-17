import { useState } from 'react'
import { Plus } from '@design-systems/icons'
import intuitBrandBalls from '../../assets/icons/brand-balls.svg'
import sendArrow from '../../assets/send-arrow.svg'
import styles from '../../styles/automated/ChatInput.module.css'

interface ChatInputProps {
  onSend: (text: string) => void
  placeholder?: string
  legalDisclaimer?: string
  /** Compact composer for AI review footer — no upward fade, tighter padding */
  variant?: 'default' | 'mini'
  showFade?: boolean
}

export default function ChatInput({
  onSend,
  placeholder = 'Ask {Agent / product name}',
  legalDisclaimer = 'Important information about how we use generative AI',
  variant = 'default',
  showFade,
}: ChatInputProps) {
  const isMini = variant === 'mini'
  const fadeVisible = showFade ?? !isMini
  const [value, setValue] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault()
      onSend(value.trim())
      setValue('')
    }
  }

  const handleSend = () => {
    if (value.trim()) {
      onSend(value.trim())
      setValue('')
    }
  }

  return (
    <div className={`${styles.container} ${isMini ? styles.containerMini : ''}`}>
      {fadeVisible && <div className={styles.fade} aria-hidden />}

      <div className={`${styles.inputBox} ${isMini ? styles.inputBoxMini : ''}`}>
        {/* Text area */}
        <div className={styles.textArea}>
          <textarea
            className={styles.textAreaInput}
            placeholder={placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>

        {/* Actions row */}
        <div className={styles.actions}>
          <div className={styles.actionsLeft}>
            {/* + attach button */}
            <button className={styles.pillBtn} aria-label="Attach">
              <span className={styles.pillBtnIcon}>
                <Plus size="medium" />
              </span>
            </button>

            {/* Intuit chip */}
            <button className={`${styles.pillBtn} ${styles.pillBtnIntuit}`} aria-label="Intuit">
              <img src={intuitBrandBalls} alt="" className={styles.intuitBrandIcon} />
              <span className={styles.pillBtnLabel}>Intuit</span>
            </button>
          </div>

          <div className={styles.actionsRight}>
            {/* Send button */}
            <button
              className={`${styles.sendBtn} ${value.trim() ? styles.active : ''}`}
              aria-label="Send"
              onClick={handleSend}
            >
              <img src={sendArrow} alt="" className={styles.sendBtnIcon} />
            </button>
          </div>
        </div>
      </div>

      <span className={styles.legal}>{legalDisclaimer}</span>
    </div>
  )
}
