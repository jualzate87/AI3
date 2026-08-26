import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Lightning, Undo } from '@design-systems/icons'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import SegmentedButton from '@ids-ts/segmented-button'
import '@ids-ts/segmented-button/dist/main.css'
import { completeDocumentImport, resetPersistedReviewState } from '../../hooks/useSyncedReviewState'
import {
  buildHashRouteUrl,
  getStoredDemoRole,
  PREPARER_DATA_REVIEW_PATH,
  PREPARER_DIAGNOSTICS_PATH,
  REVIEWER_DATA_REVIEW_PATH,
  setStoredDemoRole,
} from '../../lib/prototypeRoutes'
import { LAUNCH_POINTS, type LaunchPoint } from './launchPointsData'
import styles from './LaunchPointsFab.module.css'

export type DemoRole = 'preparer' | 'reviewer'

function statusBadge(status: LaunchPoint['status']) {
  if (status === 'live') {
    return <Badge status="success" label="LIVE" capitalization="uppercase" priority="secondary" />
  }
  return <Badge status="warn" label="STUB" capitalization="uppercase" priority="secondary" />
}

function prepareDiagnosticsLaunch(): void {
  completeDocumentImport()
  sessionStorage.setItem('protoc3-session-started', '1')
  sessionStorage.setItem('protoc3-imports-started', '1')
  sessionStorage.setItem('protoc3-phase', 'diagnostics')
  sessionStorage.setItem('agentLoaded', '1')
  setStoredDemoRole('preparer')
}

function resolveDemoRole(search: string): DemoRole {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (params.get('role') === 'reviewer') return 'reviewer'
  const stored = getStoredDemoRole()
  return stored ?? 'preparer'
}

export default function LaunchPointsFab() {
  const navigate = useNavigate()
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const role = resolveDemoRole(location.search)

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

  const handleRoleChange = useCallback(
    (nextRole: DemoRole) => {
      setStoredDemoRole(nextRole)
      if (location.pathname === '/data-review') {
        window.location.assign(
          buildHashRouteUrl(
            nextRole === 'reviewer' ? REVIEWER_DATA_REVIEW_PATH : PREPARER_DATA_REVIEW_PATH,
          ),
        )
        return
      }
      navigate(nextRole === 'reviewer' ? '/smart-return?role=reviewer' : '/smart-return', {
        replace: true,
      })
      setOpen(false)
    },
    [location.pathname, navigate],
  )

  const handleLaunchPoint = useCallback(
    (point: LaunchPoint) => {
      if (!point.route) return
      setOpen(false)
      if (point.route === PREPARER_DIAGNOSTICS_PATH) {
        prepareDiagnosticsLaunch()
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
    setStoredDemoRole('preparer')
    setOpen(false)
    window.location.assign(buildHashRouteUrl('/smart-return'))
  }, [])

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
            <p className={styles.panelSubtitle}>where an accountant can start a request</p>
          </div>

          <div className={styles.roleRow}>
            <p className={styles.roleLabel}>Prototype demo role</p>
            <SegmentedButton
              ariaLabel="Demo role"
              buttonType="mini"
              buttonInfos={[
                {
                  label: 'Preparer',
                  selected: role === 'preparer',
                  onClick: () => handleRoleChange('preparer'),
                },
                {
                  label: 'Reviewer',
                  selected: role === 'reviewer',
                  onClick: () => handleRoleChange('reviewer'),
                },
              ]}
            />
          </div>

          <ul className={styles.list}>
            {LAUNCH_POINTS.map(point => {
              const navigable = Boolean(point.route)
              return (
                <li key={point.id} className={styles.listItem}>
                  <button
                    type="button"
                    className={styles.itemBtn}
                    disabled={!navigable}
                    onClick={() => handleLaunchPoint(point)}
                  >
                    <span className={styles.itemNumber}>{point.id}</span>
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
