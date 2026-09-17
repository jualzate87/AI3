import { useEffect, useRef, useState } from 'react'
import { Checkmark } from '@design-systems/icons'
import {
  AGENT_LAYOUT_LABELS,
  type AgentReviewLayoutMode,
} from './agentReviewLayout'
import styles from '../../styles/agent-review/AgentReviewLayoutMenu.module.css'

const MENU_OPTIONS: AgentReviewLayoutMode[] = ['floating', 'sidebar', 'fullscreen']

interface AgentReviewLayoutMenuProps {
  mode: AgentReviewLayoutMode
  onChange: (mode: AgentReviewLayoutMode) => void
  /** When true, floating is disabled (prototype stub). */
  disableFloating?: boolean
}

export default function AgentReviewLayoutMenu({
  mode,
  onChange,
  disableFloating = true,
}: AgentReviewLayoutMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Change layout"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
      >
        <span className={styles.triggerBars} aria-hidden>
          <span />
          <span />
        </span>
      </button>

      {open ? (
        <ul className={styles.menu} role="menu" aria-label="Layout options">
          {MENU_OPTIONS.map(option => {
            const disabled = disableFloating && option === 'floating'
            const selected = mode === option
            return (
              <li key={option} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  disabled={disabled}
                  className={`${styles.menuItem} ${selected ? styles.menuItemSelected : ''}`}
                  onClick={() => {
                    if (disabled) return
                    onChange(option)
                    setOpen(false)
                  }}
                >
                  <span>{AGENT_LAYOUT_LABELS[option]}</span>
                  {selected ? <Checkmark size="small" aria-hidden /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
