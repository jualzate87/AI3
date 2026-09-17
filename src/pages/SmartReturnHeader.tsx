import { useNavigate } from 'react-router-dom'
import type { RefObject } from 'react'
import {
  CircleQuestion, Notification, Settings, Lock, Person,
  ChevronDown, List, Edit, Checklist,
  Send, CloudUpload, Rocket, NewWindow,
} from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitIntelligenceLogo from '../assets/icons/intuit-intelligence-logo-small.svg'
import HeaderSelectMenu from '../components/HeaderSelectMenu'
import { useReturnWorkflow } from '../contexts/ReturnWorkflowContext'
import { RETURN_STATUSES, TEAM_MEMBERS } from '../lib/returnWorkflow'
import { INTELLIGENCE_SUBHEADER_CTA } from './agent-review/agentIntelligenceCopy'
import { openReviewReturnPopout } from '../lib/prototypeRoutes'
import styles from '../styles/SmartReturnHeader.module.css'

export type ReturnHeaderTab = 'profile' | 'smartreturn' | 'inputreturn' | 'checkreturns' | 'filereturn'

interface SmartReturnHeaderProps {
  activeTab?: ReturnHeaderTab
  /** Show Review return CTA in tab row (reviewer on SmartReturn landing) */
  showReviewReturn?: boolean
  /** Primary styling after review has started */
  reviewReturnStarted?: boolean
  onReviewReturn?: () => void
  /** Show Source documents CTA in tab row (Check return) */
  showViewSourceDocuments?: boolean
  onViewSourceDocuments?: () => void
  /** Intuit Intelligence review CTA (Check return tab) */
  onAiReview?: () => void
  /** Anchor for proactive AI handoff popover */
  aiReviewButtonRef?: RefObject<HTMLButtonElement | null>
}

export default function SmartReturnHeader({
  activeTab = 'smartreturn',
  showReviewReturn = false,
  reviewReturnStarted = false,
  onReviewReturn,
  showViewSourceDocuments = false,
  onViewSourceDocuments,
  onAiReview,
  aiReviewButtonRef,
}: SmartReturnHeaderProps) {
  const navigate = useNavigate()
  const {
    assignee,
    status,
    currentUser,
    requestAssigneeChange,
    requestStatusChange,
  } = useReturnWorkflow()

  const handleReviewReturnClick = () => {
    if (onReviewReturn) {
      onReviewReturn()
      return
    }
    openReviewReturnPopout('1040')
  }

  const otherCollaborators = TEAM_MEMBERS.filter(
    member => member.id !== currentUser.id && member.id !== assignee.id,
  )

  return (
    <div className={styles.header}>
      {/* ── Row 1: Product header 48px ── */}
      <div className={styles.row1}>
        <span className={styles.businessName}>Honey Tax Accounting</span>
        <div className={styles.row1Right}>
          <button type="button" className={styles.navBtn}>
            <CircleQuestion size="small" />
            <span className={styles.navBtnLabel}>Help</span>
          </button>
          <button type="button" className={styles.navBtn}>
            <Notification size="small" />
            <span className={styles.navBtnLabel}>Notifications</span>
          </button>
          <button type="button" className={styles.navBtn}>
            <Settings size="small" />
            <span className={styles.navBtnLabel}>Settings</span>
          </button>
          <div className={styles.row1Divider} />
          <div
            className={styles.oiaaAvatar}
            style={{ background: currentUser.avatarColor }}
            title={currentUser.name}
          >
            {currentUser.initial}
          </div>
        </div>
      </div>

      {/* ── Row 2: Client sub-header 63px ── */}
      <div className={styles.row2}>
        <div className={styles.row2Left}>
          <div className={styles.clientName}>Jordan<br />Wells</div>
          <Lock size="small" className={styles.lockIcon} />
          <button type="button" className={styles.clientProfileBtn}>
            <Person size="small" />
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
            <div
              className={styles.avatarD}
              style={{ background: assignee.avatarColor }}
              title={assignee.name}
            >
              {assignee.initial}
            </div>
            {otherCollaborators.slice(0, 1).map(member => (
              <div
                key={member.id}
                className={styles.avatarH}
                style={{ background: member.avatarColor }}
                title={member.name}
              >
                {member.initial}
              </div>
            ))}
            {otherCollaborators.length > 1 ? (
              <div className={styles.avatarPlus}>+{otherCollaborators.length - 1}</div>
            ) : null}
          </div>
          <HeaderSelectMenu
            ariaLabel="Select assignee"
            value={assignee.id}
            options={TEAM_MEMBERS.map(member => ({ id: member.id, label: member.name }))}
            onChange={requestAssigneeChange}
          />
          <HeaderSelectMenu
            ariaLabel="Select status"
            value={status.id}
            options={RETURN_STATUSES.map(item => ({ id: item.id, label: item.label }))}
            onChange={id => requestStatusChange(id as typeof status.id)}
          />
          <Button priority="primary">
            Return actions <ChevronDown size="small" />
          </Button>
        </div>
      </div>

      {/* ── Row 3: Tab bar 48px ── */}
      <div className={styles.row3}>
        <div className={styles.tabsLeft}>
          <button type="button" className={styles.tab}>
            <List size="small" /> Profile
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'smartreturn' ? styles.tabActive : ''}`}
            onClick={() => navigate('/smart-return')}
          >
            <Rocket size="small" /> SmartReturn
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'inputreturn' ? styles.tabActive : ''}`}
            onClick={() => navigate('/input-return')}
          >
            <Edit size="small" /> Input return
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'checkreturns' ? styles.tabActive : ''}`}
            onClick={() => navigate('/check-return')}
          >
            <Checklist size="small" /> Check return
          </button>
          <button type="button" className={styles.tab}>
            <Send size="small" /> File return
          </button>
        </div>
        <div className={styles.tabRowSpacer} aria-hidden />
        <div className={styles.tabsRight}>
          <span className={styles.tabMeta}>
            <CloudUpload size="small" /> Saved at 11:34 AM
          </span>
          {showReviewReturn && (
            <Button
              priority="secondary"
              purpose="passive"
              onClick={handleReviewReturnClick}
              automationId="review-return-header-cta"
            >
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
              Source documents
              <NewWindow size="small" aria-hidden />
            </Button>
          )}
          {activeTab === 'checkreturns' && onAiReview && (
            <Button
              innerRef={aiReviewButtonRef}
              className={styles.aiReviewBtn}
              priority="secondary"
              purpose="passive"
              onClick={onAiReview}
              automationId="ai-review-header-cta"
            >
              <img src={intuitIntelligenceLogo} alt="" className={styles.headerBtnIcon} aria-hidden />
              {INTELLIGENCE_SUBHEADER_CTA}
            </Button>
          )}
        </div>
      </div>

    </div>
  )
}
