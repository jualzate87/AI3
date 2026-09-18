import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Lightning, Undo } from '@design-systems/icons'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import {
  resetAgentDemoReviewState,
  resetPersistedReviewState,
} from '../../hooks/useSyncedReviewState'
import {
  AGENT_MODE_SESSION_KEY,
  DEMO_RESET_TOAST_KEY,
  buildHashRouteUrl,
  PREPARER_AGENT_DIAGNOSTICS_PATH,
  PREPARER_DIAGNOSTICS_PATH,
  setStoredDemoRole,
} from '../../lib/prototypeRoutes'
import {
  getCurrentUser,
  preparePreparerHandoffLaunch,
  prepareReviewerHandoffLaunch,
  resetReturnWorkflow,
} from '../../lib/returnWorkflow'
import { seedPreparerDocStampsIfEmpty } from '../../hooks/useSyncedReviewState'
import { LAUNCH_POINTS, type LaunchPoint } from './launchPointsData'

const REVIEWER_HANDOFF_PATH = '/check-return?handoff=reviewer'
const PREPARER_HANDOFF_PATH = '/check-return?handoff=preparer'
import styles from './LaunchPointsFab.module.css'

function statusBadge(status: LaunchPoint['status']) {
  if (status === 'live') {
    return <Badge status="success" label="LIVE" capitalization="caps" priority="secondary" />
  }
  return <Badge status="draft" label="STUB" capitalization="caps" priority="secondary" />
}

function prepareDiagnosticsLaunch(): void {
  sessionStorage.removeItem(AGENT_MODE_SESSION_KEY)
  sessionStorage.setItem('protoc3-session-started', '1')
  sessionStorage.setItem('protoc3-imports-started', '1')
  sessionStorage.setItem('protoc3-phase', 'diagnostics')
  sessionStorage.setItem('agentLoaded', '1')
  setStoredDemoRole('preparer')
}

function prepareAgentLaunch(): void {
  resetAgentDemoReviewState()
  sessionStorage.setItem(AGENT_MODE_SESSION_KEY, '1')
  sessionStorage.setItem('protoc3-session-started', '1')
  sessionStorage.setItem('protoc3-imports-started', '1')
  sessionStorage.removeItem('protoc3-phase')
  sessionStorage.removeItem('protoc3-agent-visit-active')
  sessionStorage.setItem('agentLoaded', '1')
  setStoredDemoRole('preparer')
}

export default function LaunchPointsFab() {
  const navigate = useNavigate()
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const hideOnPopout = location.pathname.endsWith('-popout')

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

  const handleLaunchPoint = useCallback(
    (point: LaunchPoint) => {
      if (!point.route) return
      setOpen(false)
      if (point.route === PREPARER_DIAGNOSTICS_PATH) {
        prepareDiagnosticsLaunch()
      } else if (point.route === PREPARER_AGENT_DIAGNOSTICS_PATH) {
        prepareAgentLaunch()
      } else if (point.route === REVIEWER_HANDOFF_PATH) {
        prepareReviewerHandoffLaunch()
        seedPreparerDocStampsIfEmpty('Sarah Chen')
        setStoredDemoRole('reviewer')
        navigate(REVIEWER_HANDOFF_PATH)
        return
      } else if (point.route === PREPARER_HANDOFF_PATH) {
        preparePreparerHandoffLaunch()
        seedPreparerDocStampsIfEmpty('Sarah Chen')
        setStoredDemoRole('preparer')
        navigate(PREPARER_HANDOFF_PATH)
        return
      }
      navigate(point.route)
    },
    [navigate],
  )

  const handleResetDemo = useCallback(() => {
    resetPersistedReviewState()
    try {
      localStorage.removeItem('protoc3-notes')
    } catch {
      // ignore
    }
    sessionStorage.removeItem('protoc3-session-started')
    sessionStorage.removeItem('protoc3-imports-started')
    sessionStorage.removeItem('protoc3-phase')
    sessionStorage.removeItem('agentLoaded')
    sessionStorage.removeItem(AGENT_MODE_SESSION_KEY)
    resetReturnWorkflow()
    setStoredDemoRole('preparer')
    setOpen(false)
    try {
      sessionStorage.setItem(DEMO_RESET_TOAST_KEY, '1')
    } catch {
      // ignore
    }
    window.location.assign(buildHashRouteUrl('/smart-return'))
  }, [])

  if (hideOnPopout) {
    return null
  }

  // You can only join as somebody else, so the handoff you are already in drops off the list.
  const currentUserId = open ? getCurrentUser().id : null
  const visiblePoints = LAUNCH_POINTS.filter(point => point.joinAs !== currentUserId)

  return (
    <div className={styles.fabRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(prev => !prev)}
      >
        <span className={styles.triggerIcon} aria-hidden>
          <Lightning size="small" />
        </span>
        Launch points
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Launch points">
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Launch points</h2>
            <p className={styles.panelSubtitle}>AI diagnostics demo entry points</p>
          </div>

          <ul className={styles.list}>
            {visiblePoints.map((point, index) => {
              const navigable = Boolean(point.route)
              return (
                <li key={point.id} className={styles.listItem}>
                  <button
                    type="button"
                    className={styles.itemBtn}
                    disabled={!navigable}
                    onClick={() => handleLaunchPoint(point)}
                  >
                    <span className={styles.itemNumber}>{index + 1}</span>
                    <span className={styles.itemBody}>
                      <span className={styles.itemTitleRow}>
                        <span className={styles.itemTitle}>{point.title}</span>
                        {statusBadge(point.status)}
                      </span>
                      <p className={styles.itemDescription}>{point.description}</p>
                    </span>
                    {navigable && (
                      <span className={styles.itemChevron} aria-hidden>
                        <ChevronRight size="small" />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className={styles.panelFooter}>
            <button type="button" className={styles.resetBtn} onClick={handleResetDemo}>
              <span className={styles.resetIcon} aria-hidden>
                <Undo size="small" />
              </span>
              <span>
                <p className={styles.resetTitle}>Reset demo</p>
                <p className={styles.resetSubtitle}>back to &apos;Send client request&apos;</p>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
