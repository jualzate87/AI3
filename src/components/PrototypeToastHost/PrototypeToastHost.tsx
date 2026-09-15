import { useEffect, useState } from 'react'
import ToastMessage from '@ids-ts/toast-message'
import '@ids-ts/toast-message/dist/main.css'
import { CircleCheckFill } from '@design-systems/icons'
import { DEMO_RESET_TOAST_KEY } from '../../lib/prototypeRoutes'
import styles from './PrototypeToastHost.module.css'

/**
 * App-level success toasts for prototype actions (e.g. demo reset).
 * Uses IDS ToastMessage — top-center placement per component defaults.
 */
export default function PrototypeToastHost() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DEMO_RESET_TOAST_KEY) !== '1') return
      sessionStorage.removeItem(DEMO_RESET_TOAST_KEY)
      setOpen(true)
    } catch {
      // ignore storage errors
    }
  }, [])

  return (
    <div className={styles.host} aria-live="polite">
      <ToastMessage
        open={open}
        dismissible
        showIcon
        duration={6000}
        actionLabel="Dismiss"
        icon={<CircleCheckFill focusable={false} data-testid="circleCheckIcon" />}
        onClose={() => setOpen(false)}
        onActionClick={() => setOpen(false)}
      >
        Demo reset complete. You&apos;re back at Send client request.
      </ToastMessage>
    </div>
  )
}
