import { useNavigate } from 'react-router-dom'
import {
  Question, Notification, Settings, Lock, PersonThree, CircleInfo,
  ChevronDown, List, Edit, Checklist,
  Send, CloudUpload, Rocket, PopOut,
} from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { openReviewReturnPopout } from '../lib/prototypeRoutes'
import CheckReturnHeaderBar from './check-return/CheckReturnHeaderBar'
import styles from '../styles/SmartReturnHeader.module.css'

export type ReturnHeaderTab = 'profile' | 'smartreturn' | 'inputreturn' | 'checkreturns' | 'filereturn'

interface SmartReturnHeaderProps {
  activeTab?: ReturnHeaderTab
  /** Show Review return CTA in tab row (reviewer on SmartReturn landing) */
  showReviewReturn?: boolean
  /** Primary styling after review has started */
  reviewReturnStarted?: boolean
  onReviewReturn?: () => void
  /** Show View source documents CTA in tab row (Check return) */
  showViewSourceDocuments?: boolean
  onViewSourceDocuments?: () => void
}

export default function SmartReturnHeader({
  activeTab = 'smartreturn',
  showReviewReturn = false,
  reviewReturnStarted = false,
  onReviewReturn,
  showViewSourceDocuments = false,
  onViewSourceDocuments,
}: SmartReturnHeaderProps) {
  const navigate = useNavigate()
  const isCheckReturnContext = activeTab === 'checkreturns'

  const handleReviewReturnClick = () => {
    if (onReviewReturn) {
      onReviewReturn()
      return
    }
    openReviewReturnPopout('1040')
  }

  const utilityCluster = (
    <div className={styles.utilityCluster}>
      <button type="button" className={styles.utilityBtn}>
        <Question size="small" aria-hidden />
        <span className={styles.utilityBtnLabel}>Help</span>
      </button>
      <button type="button" className={styles.utilityBtn}>
        <Settings size="small" aria-hidden />
        <span className={styles.utilityBtnLabel}>Settings</span>
      </button>
      <button type="button" className={styles.utilityIconBtn} aria-label="Notifications">
        <Notification size="small" />
      </button>
      <button type="button" className={styles.utilityIconBtn} aria-label="Help resources">
        <CircleInfo size="small" />
      </button>
      <span className={styles.utilityNotificationsLabel}>Notifications</span>
      <nav className={styles.utilityLinks} aria-label="Product links">
        <button type="button" className={styles.utilityLink}>What&apos;s new</button>
        <button type="button" className={styles.utilityLink}>Give feedback</button>
        <button type="button" className={styles.utilityLink}>Privacy</button>
        <button type="button" className={styles.utilityLink}>Terms</button>
        <button type="button" className={styles.utilityLink}>About</button>
      </nav>
      <div className={styles.utilityDivider} aria-hidden />
      <div className={styles.userAvatar} aria-label="Signed in user">Z</div>
    </div>
  )

  return (
    <div className={styles.header}>
      {/* ── Row 1: Product header 48px (hidden on Check return — utilities live in tab row) ── */}
      {!isCheckReturnContext && (
        <div className={styles.row1}>
          <span className={styles.businessName}>Honey Tax Accounting</span>
          <div className={styles.row1Right}>
            <button type="button" className={styles.navBtn}>
              <Question size="small" />
              <span className={styles.navBtnLabel}>Help</span>
            </button>
            <button type="button" className={styles.navBtn}>
              <Settings size="small" />
              <span className={styles.navBtnLabel}>Settings</span>
            </button>
            <button type="button" className={styles.navBtn}>
              <Notification size="small" />
              <span className={styles.navBtnLabel}>Notifications</span>
            </button>
            <div className={styles.row1Divider} />
            <div className={styles.oiaaAvatar}>Z</div>
          </div>
        </div>
      )}

      {/* ── Row 2: Client sub-header 63px ── */}
      {activeTab === 'checkreturns' ? (
        <CheckReturnHeaderBar />
      ) : (
        <div className={styles.row2}>
          <div className={styles.row2Left}>
            <div className={styles.clientName}>Jordan<br />Wells</div>
            <Lock size="small" className={styles.lockIcon} />
            <button type="button" className={styles.clientProfileBtn}>
              <PersonThree size="small" />
              <span className={styles.clientProfileLabel}>Client profile</span>
            </button>
            <div className={styles.vertDivider} />
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Tax year</span>
              <div className={styles.metaValueRow}>
                <span className={styles.metaValue}>2025</span>
              </div>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Return type</span>
              <div className={styles.metaValueRow}>
                <span className={styles.metaValue}>1040</span>
              </div>
            </div>
          </div>

          <div className={styles.row2Right}>
            <div className={styles.avatarStack}>
              <div className={styles.avatarD}>D</div>
              <div className={styles.avatarH}>H</div>
              <div className={styles.avatarPlus}>+1</div>
            </div>
            <button type="button" className={styles.ghostBtn}>
              Select Asignee <ChevronDown size="small" />
            </button>
            <button type="button" className={styles.ghostBtn}>
              Select Status <ChevronDown size="small" />
            </button>
            <Button priority="primary">
              Return actions <ChevronDown size="small" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Row 3: Tab / navigation bar 48px (Figma 1380×48) ── */}
      <div className={`${styles.row3} ${isCheckReturnContext ? styles.row3CheckReturn : ''}`}>
        <div className={styles.tabsLeft}>
          {isCheckReturnContext ? (
            <>
              <button
                type="button"
                className={styles.tab}
                onClick={() => navigate('/smart-return')}
              >
                Overview
              </button>
              <button
                type="button"
                className={styles.tab}
                onClick={() => navigate('/input-return')}
              >
                <Edit size="small" aria-hidden /> Input return
              </button>
              <button
                type="button"
                className={`${styles.tab} ${styles.tabActive}`}
                onClick={() => navigate('/check-return')}
              >
                <Checklist size="small" aria-hidden /> Check return
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.tab}>
                <List size="small" aria-hidden /> Profile
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'smartreturn' ? styles.tabActive : ''}`}
                onClick={() => navigate('/smart-return')}
              >
                <Rocket size="small" aria-hidden /> SmartReturn
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'inputreturn' ? styles.tabActive : ''}`}
                onClick={() => navigate('/input-return')}
              >
                <Edit size="small" aria-hidden /> Input return
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'checkreturns' ? styles.tabActive : ''}`}
                onClick={() => navigate('/check-return')}
              >
                <Checklist size="small" aria-hidden /> Check return
              </button>
              <button type="button" className={styles.tab}>
                <Send size="small" aria-hidden /> File return
              </button>
            </>
          )}
        </div>
        <div className={styles.tabRowSpacer} aria-hidden />
        {isCheckReturnContext ? (
          <div className={styles.tabsRightCheckReturn}>
            {showViewSourceDocuments && (
              <Button
                priority="secondary"
                purpose="passive"
                onClick={onViewSourceDocuments}
                automationId="view-source-documents-header-cta"
                className={styles.tabRowCta}
              >
                <PopOut size="small" aria-hidden />
                View source documents
              </Button>
            )}
            {utilityCluster}
          </div>
        ) : (
          <div className={styles.tabsRight}>
            <span className={styles.tabMeta}>
              <CloudUpload size="small" aria-hidden /> Saved at 11:34 AM
            </span>
            {showReviewReturn && (
              <Button
                priority="secondary"
                purpose="passive"
                onClick={handleReviewReturnClick}
                automationId="review-return-header-cta"
              >
                <PopOut size="small" aria-hidden />
                Review return
              </Button>
            )}
            {showViewSourceDocuments && (
              <Button
                priority="secondary"
                purpose="passive"
                onClick={onViewSourceDocuments}
                automationId="view-source-documents-header-cta"
              >
                <PopOut size="small" aria-hidden />
                View source documents
              </Button>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
