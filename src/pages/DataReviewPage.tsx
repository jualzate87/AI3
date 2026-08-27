import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  PREPARER_DATA_REVIEW_PATH,
  REVIEWER_DATA_REVIEW_PATH,
  VALID_DATA_REVIEW_ENTRIES,
  setStoredDemoRole,
  buildHashRouteUrl,
} from '../lib/prototypeRoutes'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import { DotsSix, Panel, ChevronLeft, ChevronRight, CommentDots, ClockCounterclockwise, PopOut } from '@design-systems/icons'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import NotesPane from './data-review/NotesPane'
import type { Note } from './data-review/NotesPane'
import HandoffSummary from './data-review/HandoffSummary'
import {
  buildHandoffSnapshot,
  getOutstandingOpenCount,
  type HandoffJump,
  type HandoffMode,
  type HandoffSnapshot,
  type HandoffVoice,
} from '../data/handoffSnapshot'
import {
  deriveReviewChecklist,
  EXPECTED_SOURCE_DOCS,
} from '../data/reviewChecklist'
import {
  deriveMilestoneState,
  canSignOffFromMilestones,
  signOffBlockerFromMilestones,
} from '../data/reviewMilestones'
import {
  buildSmartReviewBrief,
  canApproveSignOff,
  countStrategicOpenItems,
} from '../data/smartReviewBrief'
import {
  PREPARER_NAME,
  REVIEWER_NAME,
  setReviewActor,
  getReviewActor,
  STORAGE_KEY,
} from '../hooks/useSyncedReviewState'
import { resolveActiveVerifyDocKey } from '../data/documentImportMeta'
import intuitAssistIcon from '../assets/icons/intuit-assist.svg'
import LeftPanel1040 from './data-review/LeftPanel1040'
import ReviewTab from './data-review/ReviewTab'
import AddItemReviewPane, { type AddItemLinkResult } from './data-review/AddItemReviewPane'
import type { ReviewInputScreen } from '../data/reviewInputScreens'
import { applyInputDocKey } from '../data/inputDocTabs'
import {
  readManualDocAttachments,
  writeManualDocAttachment,
  readUsedLibraryIds,
  writeUsedLibraryId,
  type ManualDocAttachment,
} from '../lib/manualDocAttachments'
import DocumentPreview from './data-review/DocumentPreview'
import Int1099FormPreview from './data-review/Int1099FormPreview'
import { getSourceDocPreview } from './data-review/sourceDocImages'
import DetailFields, { W2_PAYER_TABS } from './data-review/DetailFields'
import type { W2Employer } from './data-review/DetailFields'
import DetailFields1099, { INT_PAYER_TABS, intVerifiedDocKey } from './data-review/DetailFields1099'
import type { IntPayer } from './data-review/DetailFields1099'
import DetailFieldsDiv, { DIV_PAYER_TABS, divVerifiedDocKey } from './data-review/DetailFieldsDiv'
import type { DivPayer } from './data-review/DetailFieldsDiv'
import {
  buildTabConfirmCounts,
  buildTabConfirmStatus,
  buildTabReviewCounts,
  buildTabUnreviewedCounts,
  buildTabVerifiedKeys,
  buildTypeReviewed,
  countDocsIncompleteForReviewer,
  countVerifiedPacketDocs,
  getDocConfirmStatus,
  getNextUnreviewedSourceDoc,
  getUnreviewedSourceDocs,
} from './data-review/docReviewStatus'
import { isDocShownVerified, navigationForVerifiedDocKey } from '../data/verifiedDocKeys'
import DetailFields1099R, { R_PAYER_TABS } from './data-review/DetailFields1099R'
import DetailFieldsNec, { NEC_PAYER_TABS } from './data-review/DetailFieldsNec'
import AttentionCountBadge from './data-review/AttentionCountBadge'
import DocumentCountBadge from './data-review/DocumentCountBadge'
import ImportSourceBadge from '../components/ImportSourceBadge/ImportSourceBadge'
import PeelTab from './data-review/PeelTab'
import QuestionnaireResponsesPanel from './data-review/QuestionnaireResponsesPanel'
import type { QuestionnaireFieldLink, QuestionnaireResponseId } from './data-review/questionnaireData'
import type { OutputFormId } from './data-review/outputForms'
import { resolveOutputFormFromAction } from './data-review/outputForms'
import AgentReportPane from './data-review/AgentReportPane'
import CoachTip, { markCoachTipShown, readCoachTipShown, type CoachTipId } from './data-review/CoachTip'
import AgentLoadingPane from './data-review/AgentLoadingPane'
import Phase1Banner from './data-review/Phase1Banner'
import Phase1IssueBanner from './data-review/Phase1IssueBanner'
import Phase2Banner from './data-review/Phase2Banner'
import {
  countPhase1Remaining,
  countPhase1FlagsForDivPayer,
  countPhase1FlagsForIntPayer,
  countPhase1FlagsForNecPayer,
  countPhase1FlagsForRPayer,
  countPhase1FlagsForW2Payer,
  field1040ToDetail,
  get1040HighlightField,
  getNextVerifyItem,
  getTabFlagCounts,
  getInitialW2PayerFlagCount,
  getInitialDivPayerFlagCount,
  getInitialIntPayerFlagCount,
  getInitialRPayerFlagCount,
  navigationForDetailField,
  PHASE1_FLAG_KEYS,
  PHASE1_VERIFY_QUEUE,
} from './data-review/phase1FieldSync'
import {
  getPhase2Progress,
  resolveOutputFieldFromDiagnostic,
  resolveOutputFieldFromIssueField,
  type Phase2IssueKey,
} from './data-review/phase2FlagSync'
import { PHASE1_FLAG_MESSAGES } from './data-review/phase1FlagMessages'
import { buildYoyInputFlags, mergeInputFlags } from './data-review/yoyInputFlags'
import {
  importFlagCountForDisplay,
  importFlagsForDisplay,
  SHOW_IMPORT_FLAGS,
} from '../lib/prototypeFeatureFlags'
import { computeLiveReturn } from '../data/liveReturn'
import { navigationForSourceDoc } from '../data/sourceDocuments'
import img1040PriorPage1 from '../assets/jessica-1040-2024-variant-1.png'
import img1040PriorPage2 from '../assets/jessica-1040-2024-variant-2.png'
import styles from '../styles/data-review/DataReviewPage.module.css'
import dragStyles from '../styles/data-review/DragHandle.module.css'

/** Source-doc panel slide timing — matches --duration-appear/disappear-emphasize-fast */
const SOURCE_PANEL_ENTER_MS = 500
const SOURCE_PANEL_EXIT_MS = 500
/** Summary show/hide — matches --duration-transform-emphasize-fast */
const SUMMARY_TOGGLE_MS = 500
/** Collapsed "Show Summary" edge tab width */
const SHOW_SUMMARY_HANDLE_WIDTH = 44
/** Fixed width for HandoffSummary right-rail panel */
const SUMMARY_PANEL_WIDTH = 755
/** Hard floor for Summary so Return Breakdown labels aren’t truncated.
 *  Below this width the first column gets ellipsized (“eaten”). */
const LEFT_PANEL_MIN_WIDTH = 795.7
/** Absolute min Sources width when both panels are open */
const RIGHT_PANEL_MIN_WIDTH = 360
/** Matches DragHandle.module.css .handleVertical width */
const PANEL_DRAG_HANDLE_WIDTH = 16

/** Right-rail content mode — `ai+sources` shows source docs and AI diagnostics side-by-side. */
type RightPanelMode = 'closed' | 'sources' | 'ai' | 'ai+sources' | 'comments' | 'summary'

function verifyDocKeyForInput(input: ReviewInputScreen): string {
  switch (input.topTab) {
    case 'w2s':
      return input.docKey
    case '1099-divs':
      return divVerifiedDocKey(input.docKey as DivPayer)
    case '1099-ints':
      return intVerifiedDocKey(input.docKey as IntPayer)
    case '1099-rs':
      return '1099-r'
    case '1099-necs':
      return '1099-nec'
    default:
      return input.docKey
  }
}

export default function DataReviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const entry = searchParams.get('entry')
  const roleParam = searchParams.get('role')
  const startReviewParam = searchParams.get('startReview') === 'true'
  const phaseParam = searchParams.get('phase')
  const launchDiagnostics = phaseParam === 'diagnostics'

  // Valid entries: input-return (preparer) or review-return (reviewer).
  const entryValid = entry != null && VALID_DATA_REVIEW_ENTRIES.has(entry)
  useEffect(() => {
    const legacyAgent = searchParams.get('agent') === 'true'
    if (legacyAgent && !entryValid) {
      navigate(PREPARER_DATA_REVIEW_PATH, { replace: true })
      return
    }
    if (entryValid) return
    if (roleParam === 'reviewer' || searchParams.get('startReview') === 'true') {
      navigate(REVIEWER_DATA_REVIEW_PATH, { replace: true })
      return
    }
    navigate('/smart-return', { replace: true })
  }, [entry, entryValid, roleParam, searchParams, navigate])

  // Source-doc review state — flags, reviewed fields, active tab, editable field
  // values — persisted in localStorage via useSyncedReviewState (cross-tab handoff).
  const {
    activeTopTab, setActiveTopTab,
    activeSubTab, setActiveSubTab,
    selectedField, setSelectedField,
    wages, setWages,
    amounts, updateAmounts,
    fieldValues, updateFieldValue,
    reviewedFields,
    editedFields,
    markEdited,
    fieldOverrides,
    setFieldOverride,
    activeDivPayer, setActiveDivPayer,
    activeIntPayer, setActiveIntPayer,
    markReviewed: handleMarkReviewed,
    markReviewedBulk: handleMarkReviewedBulk,
    verifiedDocs,
    verifiedDocsMeta,
    toggleVerifiedDoc,
    summaryCheckedFields,
    summaryCheckedMeta,
    reviewerConfirmedFields,
    reviewerConfirmedMeta,
    reviewerConfirmedDocs,
    reviewerConfirmedDocsMeta,
    reviewerConfirmStaleFields,
    toggleSummaryChecked,
    toggleSummaryPreparerCheck,
    toggleSummaryReviewerConfirm,
    summaryFlaggedFields,
    summaryFlaggedMeta,
    toggleSummaryFlagged,
    summaryFlagNotes,
    summaryFlagActivity,
    setSummaryFlagNote,
    editedFieldsMeta,
    manualChecklistItems,
    setManualChecklistItem,
    completedMilestones,
    setMilestoneDeclaration,
    reviewerSignedOffForms,
    reviewerSignedOffFormsMeta,
    toggleReviewerFormSignOff,
    resetReviewState,
  } = useSyncedReviewState()
  const liveTotals = computeLiveReturn(amounts)
  const total1a = liveTotals.wages
  const totalWithholding = liveTotals.totalWithholding
  const yoyInputFlags = buildYoyInputFlags(liveTotals, amounts)
  const updateField = (key: keyof typeof fieldValues, value: number | { techCircle: number }) =>
    updateFieldValue(key, value)
  // Agent panel width in px when open (default 588px, user-resizable)
  const [agentPanelWidth, setAgentPanelWidth] = useState(588)
  // Right panel width in px (default ~65% viewport once imports start)
  const [rightPanelWidth, setRightPanelWidth] = useState(() =>
    typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.65) : 920,
  )
  // Body width for Sources-panel share of the row (drives auto side-by-side).
  const [bodyWidth, setBodyWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1400,
  )
  // Suppress panel width CSS transitions while the user is dragging a resize handle
  const [panelResizing, setPanelResizing] = useState(false)
  // Top/bottom section height ratio in right panel (0-100, where value = preview percentage)
  const [previewHeight, setPreviewHeight] = useState(40)
  /** Source panel detached to popout window */
  const [poppedOut, setPoppedOut] = useState(false)
  // Unified right rail — one shell, one active mode (sources | ai | comments | summary)
  const isPreparerEntry = entry === 'input-return' && roleParam !== 'reviewer'
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('closed')
  // Whether the right panel is animating out (slide-out before mode → closed)
  const [rightPanelExiting, setRightPanelExiting] = useState(false)
  // Agent sub-state when mode === 'ai': idle → loading → report → closing
  const [agentView, setAgentView] = useState<'idle' | 'loading' | 'report' | 'closing'>('idle')
  // Right panel animating-in after open
  const [rightPanelAnimating, setRightPanelAnimating] = useState(false)
  // Fade-out for comments / summary close
  const [panelClosing, setPanelClosing] = useState(false)
  // Whether YoY analysis is expanded (screen 4) — drives -15% badge on 1040
  const [yoyExpanded, setYoyExpanded] = useState(false)
  // Whether user navigated to source docs from the agent panel — shows back link
  const [fromAgent, setFromAgent] = useState(false)
  // Which agent subview to restore when going back to agent insights
  // 'overview' = report overview, 'yoyDetail' = YoY detail pane open
  const [agentSubView, setAgentSubView] = useState<'overview' | 'yoyDetail'>('overview')
  // Notes / comments — persisted for C2 handoff (localStorage for cross-tab reviewer)
  const NOTES_KEY = 'protoc3-notes'
  const SESSION_STARTED_KEY = 'protoc3-session-started'
  const SESSION_IMPORTS_KEY = 'protoc3-imports-started'
  const SESSION_PHASE_KEY = 'protoc3-phase'
  const loadNotes = (): Note[] => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#/, '')
      const q = hash.indexOf('?')
      if (q !== -1) {
        const params = new URLSearchParams(hash.slice(q + 1))
        if (params.get('entry') === 'input-return' && params.get('role') !== 'reviewer') {
          return []
        }
      }
    }
    try {
      const fromLocal = localStorage.getItem(NOTES_KEY)
      if (fromLocal) return JSON.parse(fromLocal) as Note[]
      const fromSession = sessionStorage.getItem(NOTES_KEY)
      if (fromSession) {
        localStorage.setItem(NOTES_KEY, fromSession)
        sessionStorage.removeItem(NOTES_KEY)
        return JSON.parse(fromSession) as Note[]
      }
    } catch { /* ignore */ }
    return []
  }
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  // C2: multi-pass handoff — summary content when rightPanelMode === 'summary'
  const [reviewPass, setReviewPass] = useState<1 | 2>(() =>
    entry === 'review-return' && startReviewParam ? 2 : 1,
  )
  const [reviewRole, setReviewRole] = useState<'preparer' | 'reviewer'>(() =>
    roleParam === 'reviewer' || entry === 'review-return' ? 'reviewer' : 'preparer',
  )
  const [summaryMode, setSummaryMode] = useState<HandoffMode>('signoff-review')
  const [summaryOpts, setSummaryOpts] = useState<{
    pass?: 1 | 2
    actor?: string
    voice?: HandoffVoice
  }>({})
  /** Preparer wrap-up choice from Smart review brief (prototype handoff paths) */
  const [preparerHandoffChoice, setPreparerHandoffChoice] = useState<
    'none' | 'awaiting-reviewer' | 'finish-and-file'
  >('none')
  /** Reviewer has clicked "Review return" in return header and entered review workflow */
  const [reviewerReviewStarted, setReviewerReviewStarted] = useState(
    () => entry === 'review-return' && startReviewParam,
  )
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null)
  const actorLabel = reviewRole === 'reviewer' ? REVIEWER_NAME : PREPARER_NAME
  const pass1ActorLabel = PREPARER_NAME

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
    } catch { /* ignore */ }
  }, [notes])

  useEffect(() => {
    setReviewActor(actorLabel)
  }, [actorLabel])

  useEffect(() => {
    setStoredDemoRole(reviewRole)
  }, [reviewRole])

  // --- ProtoC: two-phase sequential review ------------------------------------
  // 'welcome'     → Intuit Assist orientation screen
  // 'import'      → Phase 1: Import Accuracy (source-doc experience)
  // 'diagnostics' → Phase 2: AI Diagnostics (agent panel primary)
  type ReviewPhase = 'welcome' | 'import' | 'diagnostics'
  const [phase, setPhase] = useState<ReviewPhase>(() =>
    entry === 'review-return' ? 'diagnostics' : 'import',
  )
  const [show1040, setShow1040] = useState(true)
  const [outputFormId, setOutputFormId] = useState<OutputFormId>('summary')
  const [importsStarted, setImportsStarted] = useState(false)
  /** First-run coach tip: hide summary */
  const [coachTip, setCoachTip] = useState<CoachTipId | null>(null)
  /** One-shot nudge when Phase 1 is fully complete (flags + docs) */
  const [continueDiagnosticsCoach, setContinueDiagnosticsCoach] = useState(false)
  /** One-shot nudge after Phase 2 diagnostics are all reviewed */
  const [outputFormsCoach, setOutputFormsCoach] = useState(false)
  const [outputSourcesCoach, setOutputSourcesCoach] = useState(false)
  /** Assist-style staged reveal when reviewer lands from Review return (new tab) */
  const [summaryBriefEnterAnim, setSummaryBriefEnterAnim] = useState(false)
  /** Explicit left-panel px width during Summary collapse/expand (null = natural flex). */
  const [leftAnimWidth, setLeftAnimWidth] = useState<number | null>(null)
  /** Keep doc|Details side-by-side during Summary toggle so flexDirection doesn't flip mid-motion. */
  const [freezePreviewSideBySide, setFreezePreviewSideBySide] = useState(false)
  const [questionnaireHighlightId, setQuestionnaireHighlightId] = useState<QuestionnaireResponseId | null>(null)
  const [addItemReviewMode, setAddItemReviewMode] = useState(false)
  const [manualAttachments, setManualAttachments] = useState<Record<string, ManualDocAttachment>>(
    () => readManualDocAttachments(),
  )
  const [usedLibraryIds, setUsedLibraryIds] = useState<Set<string>>(() => readUsedLibraryIds())

  // The import/OCR flags owned by Phase 1. Each key matches the reviewed-field key
  // emitted by the DetailFields "Edit+Save" / "Mark as correct" controls.
  // Counter of unresolved import flags — never below 0
  const phase1Remaining = countPhase1Remaining(reviewedFields)
  const phase1Complete = phase1Remaining === 0
  const phase1FlagsTotal = PHASE1_FLAG_KEYS.length
  const phase1FlagsResolved = phase1FlagsTotal - phase1Remaining
  // Per-document unresolved counts for PeelTab badges (toolbar uses unreviewed doc count)
  const tabFlagCounts = getTabFlagCounts(reviewedFields)
  // PeelTab per-payer badges — unresolved Phase 1 import flags only (mirrors tabFlagCounts)
  const divPayerFieldCounts: Record<DivPayer, number> = Object.fromEntries(
    DIV_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForDivPayer(p, reviewedFields)])
  ) as Record<DivPayer, number>
  const intPayerFieldCounts: Record<IntPayer, number> = Object.fromEntries(
    INT_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForIntPayer(p, reviewedFields)])
  ) as Record<IntPayer, number>
  const w2PayerFieldCounts: Record<W2Employer, number> = Object.fromEntries(
    W2_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForW2Payer(p, reviewedFields)])
  ) as Record<W2Employer, number>
  const tabVerifiedKeys = buildTabVerifiedKeys()
  const tabUnreviewedCounts = buildTabUnreviewedCounts({
    verifiedDocs,
    reviewerConfirmedDocs,
    tabVerifiedKeys,
  })
  const tabReviewCounts = buildTabReviewCounts({
    verifiedDocs,
    reviewerConfirmedDocs,
    tabVerifiedKeys,
  })
  const typeReviewed = buildTypeReviewed({
    verifiedDocs,
    reviewerConfirmedDocs,
    w2Counts: w2PayerFieldCounts,
    divCounts: divPayerFieldCounts,
    intCounts: intPayerFieldCounts,
    rRemaining: tabFlagCounts['1099-rs'] ?? 0,
  })
  const tabConfirmStatus = buildTabConfirmStatus({
    verifiedDocs,
    reviewerConfirmedDocs,
    tabVerifiedKeys,
    isReviewer: reviewRole === 'reviewer',
  })
  const tabConfirmCounts = buildTabConfirmCounts({
    verifiedDocs,
    reviewerConfirmedDocs,
    tabVerifiedKeys,
    isReviewer: reviewRole === 'reviewer',
  })

  const peelDocConfirmStatus = (docKey: string) => {
    if (reviewRole !== 'reviewer') return undefined
    const status = getDocConfirmStatus(verifiedDocs, docKey, reviewerConfirmedDocs)
    if (status === 'unverified') return undefined
    return status
  }

  const unreviewedSourceDocs = getUnreviewedSourceDocs({
    verifiedDocs,
    w2Counts: w2PayerFieldCounts,
    divCounts: divPayerFieldCounts,
    intCounts: intPayerFieldCounts,
    rRemaining: tabFlagCounts['1099-rs'] ?? 0,
  })
  const unreviewedDocCount = unreviewedSourceDocs.length
  const { verified: verifiedDocCount, total: totalDocCount } = countVerifiedPacketDocs({
    verifiedDocs,
    reviewerConfirmedDocs,
  })
  const flagsCleared = phase1Complete
  const docsReviewComplete = unreviewedDocCount === 0
  const phase1FullyComplete = docsReviewComplete
  // Phase 2 diagnostics progress — same dismiss rules AgentReportPane uses, so
  // resolving Phase 1 flags / editing amounts that fix an insight keeps the banner in sync.
  const phase2Progress = getPhase2Progress({
    reviewedFields,
    live: liveTotals,
    amounts,
  })
  const phase2Reviewed = phase2Progress.reviewed
  const phase2Total = phase2Progress.total
  const phase2Complete = phase2Progress.complete
  // ---------------------------------------------------------------------------

  const bodyRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  /** Split container for document preview ↔ Details (not the whole right panel). */
  const splitPaneRef = useRef<HTMLDivElement>(null)
  /** Right-panel width to restore when Show Summary expands again. */
  const preCollapseRightWidthRef = useRef<number | null>(null)
  const summaryToggleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Tracks prior right-rail open state for empty-canvas auto-restore. */
  const prevRightPanelOpenRef = useRef(false)
  /** Populated below — lets closeRightPanel restore outputs without reordering callbacks. */
  const handleShowSummaryRef = useRef<() => void>(() => {})
  const show1040Ref = useRef(show1040)
  show1040Ref.current = show1040

  useEffect(() => () => {
    if (summaryToggleTimerRef.current) clearTimeout(summaryToggleTimerRef.current)
  }, [])

  // Derived — single source of truth for which rail content is active
  const diagnosticsSourceSplit = rightPanelMode === 'ai+sources'
  const rightPanelOpen = rightPanelMode !== 'closed' || rightPanelExiting || panelClosing
  const rightPanelVisible = rightPanelMode === 'sources' || diagnosticsSourceSplit
  const bothPanelsOpen = show1040 && rightPanelOpen && rightPanelMode === 'sources'
  const notesOpen = rightPanelMode === 'comments'
  const summaryPanelOpen = rightPanelMode === 'summary'
  const agentPanelActive = rightPanelMode === 'ai' || diagnosticsSourceSplit

  const animatePanelEnter = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setRightPanelAnimating(true)
      setTimeout(() => setRightPanelAnimating(false), SOURCE_PANEL_ENTER_MS)
    }))
  }, [])

  /** Open the unified right rail in exactly one mode (replaces any current mode). */
  const openRightPanel = useCallback((mode: Exclude<RightPanelMode, 'closed'>) => {
    setPanelClosing(false)
    setRightPanelExiting(false)
    const wasClosed = rightPanelMode === 'closed'
    setRightPanelMode(mode)
    if (wasClosed) animatePanelEnter()
  }, [rightPanelMode, animatePanelEnter])

  /** Close the unified right rail (mode-specific exit animation). */
  const closeRightPanel = useCallback(() => {
    if (rightPanelMode === 'closed' && !rightPanelExiting && !panelClosing) return

    if (rightPanelMode === 'comments' || rightPanelMode === 'summary') {
      setPanelClosing(true)
      setTimeout(() => {
        setRightPanelMode('closed')
        setPanelClosing(false)
        setSummaryMode('signoff-review')
        setSummaryOpts({})
      }, 200)
      return
    }

    if (rightPanelMode === 'ai' || rightPanelMode === 'ai+sources') {
      setAgentView('closing')
      setYoyExpanded(false)
      if (rightPanelMode === 'ai+sources') {
        setTimeout(() => {
          setRightPanelMode('sources')
          setAgentView('idle')
        }, 350)
      } else {
        setSelectedField(null)
        setActiveIssueField(null)
        setTimeout(() => {
          setRightPanelMode('closed')
          setAgentView('idle')
        }, 350)
      }
      return
    }

    if (rightPanelMode === 'sources') {
      setRightPanelExiting(true)
      setTimeout(() => {
        setRightPanelMode('closed')
        setRightPanelExiting(false)
        // Belt-and-suspenders with useEffect: never leave an empty canvas.
        if (!show1040Ref.current) {
          handleShowSummaryRef.current()
        }
      }, SOURCE_PANEL_EXIT_MS)
    }
  }, [rightPanelMode, setSelectedField])

  /** Ref populated below — lets early handlers open diagnostics+sources split. */
  const openDiagnosticsSourceSplitRef = useRef<() => void>(() => {})

  const ensureSourcePanelVisible = useCallback(() => {
    if (rightPanelMode === 'ai+sources') return
    if (phase === 'diagnostics') {
      openDiagnosticsSourceSplitRef.current()
      return
    }
    if (rightPanelMode !== 'sources') openRightPanel('sources')
  }, [rightPanelMode, phase, openRightPanel])

  /** Collapse outputs when focusing source docs; pink pointer on Show outputs. */
  const hideOutputsForSourceFocusRef = useRef<() => void>(() => {})

  const startReviewingImports = useCallback(() => {
    setImportsStarted(true)
    setShow1040(true)
    const body = bodyRef.current
    const bodyW = body
      ? (body.clientWidth || body.getBoundingClientRect().width)
      : window.innerWidth
    setBodyWidth(bodyW)
    const preferred = Math.round(bodyW * 0.65)
    const maxRight = Math.max(0, bodyW - LEFT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH)
    const floor = Math.min(RIGHT_PANEL_MIN_WIDTH, maxRight)
    setRightPanelWidth(Math.max(floor, Math.min(preferred, maxRight)))
    openRightPanel('sources')
    hideOutputsForSourceFocusRef.current()
  }, [openRightPanel])

  /** Preparer import-first: size source panel on mount when landing with sources open */
  useEffect(() => {
    if (reviewRole !== 'preparer' || phase !== 'import' || !importsStarted) return
    const body = bodyRef.current
    if (!body) return
    const bodyW = body.clientWidth || body.getBoundingClientRect().width
    setBodyWidth(bodyW)
    const preferred = Math.round(bodyW * 0.65)
    const maxRight = Math.max(0, bodyW - LEFT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH)
    const floor = Math.min(RIGHT_PANEL_MIN_WIDTH, maxRight)
    setRightPanelWidth(w => Math.max(floor, Math.min(preferred, maxRight, w)))
  }, [phase, importsStarted, reviewRole])

  const dismissCoachTip = useCallback((id: CoachTipId) => {
    markCoachTipShown(id)
    setCoachTip(null)
  }, [])

  const dismissContinueDiagnosticsCoach = useCallback(() => {
    markCoachTipShown('continueDiagnostics')
    setContinueDiagnosticsCoach(false)
  }, [])

  const dismissOutputFormsCoach = useCallback(() => {
    markCoachTipShown('outputForms')
    setOutputFormsCoach(false)
  }, [])

  const dismissOutputSourcesCoach = useCallback(() => {
    markCoachTipShown('outputSourcesFirst')
    setOutputSourcesCoach(false)
  }, [])

  // First tip as soon as review starts: pink pointer on Summary (i) — no panel open
  useEffect(() => {
    if (phase !== 'import' || !show1040) return
    if (readCoachTipShown('outputSourcesFirst')) return
    setOutputFormId('summary')
    setOutputSourcesCoach(true)
  }, [phase, show1040])

  // Second tip: Hide output panel — after first tip is dismissed, when Return Summary + Sources are both open
  useEffect(() => {
    if (phase !== 'import' || !bothPanelsOpen) return
    if (readCoachTipShown('hideSummary')) return
    if (outputSourcesCoach || !readCoachTipShown('outputSourcesFirst')) return
    setCoachTip('hideSummary')
  }, [phase, bothPanelsOpen, outputSourcesCoach])
  // Continue-to-diagnostics nudge when Phase 1 is fully complete
  useEffect(() => {
    if (phase !== 'import' || !phase1FullyComplete) return
    if (readCoachTipShown('continueDiagnostics')) return
    setContinueDiagnosticsCoach(true)
  }, [phase, phase1FullyComplete])

  // Output-forms nudge when Phase 2 diagnostics are complete
  useEffect(() => {
    if (phase !== 'diagnostics' || !phase2Complete) return
    if (readCoachTipShown('outputForms')) return
    setOutputFormsCoach(true)
  }, [phase, phase2Complete])

  // If Hide Summary collapses while its tip is open, advance the sequence
  useEffect(() => {
    if (!show1040 && coachTip === 'hideSummary') {
      dismissCoachTip('hideSummary')
    }
    if (show1040 && coachTip === 'showOutputs') {
      dismissCoachTip('showOutputs')
    }
  }, [show1040, coachTip, dismissCoachTip])

  // Field that the agent flagged as an issue — drives orange highlight mode
  // Set when navigating to source docs from any issue detail pane
  const [activeIssueField, setActiveIssueField] = useState<string | null>(null)
  /** Phase 2 diagnostic with an open detail pane — output highlight follows this when set. */
  const [activeDiagnosticKey, setActiveDiagnosticKey] = useState<Phase2IssueKey | null>(null)
  const activeDiagnosticKeyRef = useRef<Phase2IssueKey | null>(null)
  activeDiagnosticKeyRef.current = activeDiagnosticKey

  // Drop stale orange output highlight once every Phase 2 diagnostic is reviewed
  useEffect(() => {
    if (!phase2Complete) return
    setActiveDiagnosticKey(null)
    setActiveIssueField(null)
  }, [phase2Complete])

  const handlePhase2MarkReviewed = useCallback((fieldName: string) => {
    handleMarkReviewed(fieldName)
    if (activeDiagnosticKeyRef.current === fieldName) {
      setActiveDiagnosticKey(null)
      setActiveIssueField(null)
    }
  }, [handleMarkReviewed])

  // Maps doc-overlay field keys → 1040 field keys (when they differ)
  const DOC_FIELD_TO_1040: Record<string, string> = {
    earlyWithdrawal: 'taxableInterest', // Box 2 flows to same 1040 line 2b
  }

  const agentOutputHighlightActive =
    agentView === 'report' || agentView === 'closing' || fromAgent

  // issueField: Summary / 1040 row for the active diagnostic (orange) — takes precedence over blue selection
  const issueField = (() => {
    if (!agentOutputHighlightActive) return null
    if (agentSubView === 'yoyDetail') return 'wages'
    if (activeIssueField) {
      const raw = DOC_FIELD_TO_1040[activeIssueField] ?? activeIssueField
      return resolveOutputFieldFromIssueField(raw)
    }
    if (activeDiagnosticKey && !reviewedFields.has(activeDiagnosticKey)) {
      return resolveOutputFieldFromDiagnostic(activeDiagnosticKey, amounts)
    }
    return null
  })()

  const selectedOutputField = resolveOutputFieldFromIssueField(selectedField)
  const highlightMode: 'orange' | 'blue' = phase === 'import'
    ? 'blue'
    : (selectedOutputField && issueField && selectedOutputField === issueField) ? 'orange' : 'blue'

  const applyVerifyNavigation = useCallback((field: string) => {
    const nav = navigationForDetailField(field)
    if (nav) {
      setActiveTopTab(nav.tab)
      if (nav.divPayer) setActiveDivPayer(nav.divPayer)
      if (nav.intPayer) setActiveIntPayer(nav.intPayer)
    }
    setSelectedField(field)
    if (reviewRole === 'reviewer') {
      ensureSourcePanelVisible()
    } else if (!importsStarted) {
      startReviewingImports()
    } else {
      ensureSourcePanelVisible()
    }
  }, [
    setActiveTopTab, setActiveDivPayer, setActiveIntPayer, setSelectedField,
    reviewRole, importsStarted, startReviewingImports, ensureSourcePanelVisible,
  ])

  const handleVerifyNext = useCallback(() => {
    if (reviewRole !== 'reviewer' && !importsStarted) startReviewingImports()
    const next = getNextVerifyItem(reviewedFields, selectedField)
    if (!next) return
    applyVerifyNavigation(next.field)
  }, [reviewRole, importsStarted, startReviewingImports, reviewedFields, selectedField, applyVerifyNavigation])

  const handleReviewNextDocument = useCallback(() => {
    if (reviewRole !== 'reviewer') {
      if (!importsStarted) startReviewingImports()
      else ensureSourcePanelVisible()
    } else {
      ensureSourcePanelVisible()
    }
    const next = getNextUnreviewedSourceDoc(unreviewedSourceDocs, {
      tab: activeTopTab,
      w2SubTab: activeSubTab,
      divPayer: activeDivPayer,
      intPayer: activeIntPayer,
    })
    if (!next) return
    setActiveTopTab(next.tab)
    if (next.w2SubTab) setActiveSubTab(next.w2SubTab)
    if (next.divPayer) setActiveDivPayer(next.divPayer)
    if (next.intPayer) setActiveIntPayer(next.intPayer)
    setSelectedField(null)
    setActiveIssueField(null)
    setActiveDiagnosticKey(null)
    if (next.tab === 'questionnaire') setQuestionnaireHighlightId(null)
  }, [
    reviewRole, importsStarted, startReviewingImports, ensureSourcePanelVisible,
    unreviewedSourceDocs, activeTopTab, activeSubTab, activeDivPayer, activeIntPayer,
    setActiveTopTab, setActiveSubTab, setActiveDivPayer, setActiveIntPayer, setSelectedField,
  ])

  const handleAddItemClick = useCallback(() => {
    if (!importsStarted) startReviewingImports()
    else ensureSourcePanelVisible()
    setAddItemReviewMode(true)
    setSelectedField(null)
    setActiveIssueField(null)
  }, [importsStarted, startReviewingImports, ensureSourcePanelVisible, setSelectedField])

  const handleAddItemLink = useCallback((result: AddItemLinkResult) => {
    const verifyKey = verifyDocKeyForInput(result.input)

    if (!result.importReady) {
      const nextAttachments = writeManualDocAttachment({
        docKey: verifyKey,
        imageSrc: result.libraryDoc.imageSrc,
        libraryId: result.libraryDoc.id,
        label: result.libraryDoc.label,
      })
      setManualAttachments(nextAttachments)
    }

    setUsedLibraryIds(writeUsedLibraryId(result.libraryDoc.id))

    setActiveTopTab(result.input.topTab)
    applyInputDocKey(result.input.topTab, result.input.docKey, {
      setActiveSubTab,
      setActiveDivPayer,
      setActiveIntPayer,
    })

    setSelectedField(null)
    setActiveIssueField(null)
    setAddItemReviewMode(false)

    if (!importsStarted) startReviewingImports()
    else ensureSourcePanelVisible()
  }, [
    setActiveTopTab,
    setActiveSubTab,
    setActiveDivPayer,
    setActiveIntPayer,
    setSelectedField,
    importsStarted,
    startReviewingImports,
    ensureSourcePanelVisible,
  ])


  const handleQuestionnaireNavigateToField = useCallback((link: QuestionnaireFieldLink) => {
    setQuestionnaireHighlightId(null)

    if (link.summaryOnly) {
      setSelectedField(link.fieldKey)
      setActiveIssueField(link.fieldKey)
      setOutputFormId('summary')
      setShow1040(true)
      const rowKey = get1040HighlightField(link.fieldKey) ?? link.fieldKey
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.querySelector(`[data-field-row="${rowKey}"]`)?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          })
        })
      })
      if (reviewRole !== 'reviewer' && !importsStarted) startReviewingImports()
      else ensureSourcePanelVisible()
      return
    }

    if (link.tab) {
      setActiveTopTab(link.tab)
    } else {
      const nav = navigationForDetailField(link.fieldKey)
      if (nav?.tab) setActiveTopTab(nav.tab)
      if (nav?.divPayer) setActiveDivPayer(nav.divPayer)
      if (nav?.intPayer) setActiveIntPayer(nav.intPayer)
    }

    setSelectedField(link.fieldKey)
    setActiveIssueField(link.fieldKey)
    if (reviewRole !== 'reviewer' && !importsStarted) startReviewingImports()
    else ensureSourcePanelVisible()
  }, [
    reviewRole,
    importsStarted,
    startReviewingImports,
    ensureSourcePanelVisible,
    setActiveTopTab,
    setActiveDivPayer,
    setActiveIntPayer,
    setSelectedField,
    setActiveIssueField,
    setOutputFormId,
    setShow1040,
  ])

  const handleFieldSelect = useCallback((field: string | null) => {
    setSelectedField(field)
    if (phase === 'import' && field && reviewRole === 'preparer') {
      if (!importsStarted) startReviewingImports()
      else ensureSourcePanelVisible()
    }
    if (reviewRole === 'reviewer' && field) {
      ensureSourcePanelVisible()
    }
  }, [phase, reviewRole, setSelectedField, importsStarted, startReviewingImports, ensureSourcePanelVisible])

  const handleNavigateToSourceDoc = useCallback((docId: string) => {
    const nav = navigationForVerifiedDocKey(docId) ?? navigationForSourceDoc(docId)
    if (!nav) return
    
    setActiveTopTab(nav.tab)
    if (nav.subTab) setActiveSubTab(nav.subTab)
    if (nav.divPayer) setActiveDivPayer(nav.divPayer)
    if (nav.intPayer) setActiveIntPayer(nav.intPayer)

    if (reviewRole === 'reviewer') {
      ensureSourcePanelVisible()
    } else if (phase === 'diagnostics') {
      setFromAgent(true)
      setAgentView('report')
      openDiagnosticsSourceSplitRef.current()
    } else if (!importsStarted) {
      startReviewingImports()
    } else {
      ensureSourcePanelVisible()
      hideOutputsForSourceFocusRef.current()
    }
  }, [
    reviewRole,
    phase,
    rightPanelMode,
    importsStarted,
    startReviewingImports,
    ensureSourcePanelVisible,
    setActiveTopTab,
    setActiveSubTab,
    setActiveDivPayer,
    setActiveIntPayer,
  ])

  /** From FieldPopover source row — jump to doc + highlight the matching detail field. */
  const handleNavigateSource = useCallback((source: {
    docId: string
    detailFieldId: string
    label: string
  }) => {
    handleNavigateToSourceDoc(source.docId)
    setSelectedField(source.detailFieldId)
  }, [handleNavigateToSourceDoc, setSelectedField])

  /** ProtoC: 1040 row click selects/highlights only — does not open Sources until user follows a source link or banner CTA. */
  const handle1040FieldClick = useCallback((field1040: string | null) => {
    if (!field1040) {
      setSelectedField(null)
      return
    }
    const mapped = field1040ToDetail(field1040)
    setSelectedField(mapped?.field ?? field1040)
  }, [setSelectedField])

  const highlightField1040 = resolveOutputFieldFromIssueField(selectedField)

  const activeVerifyDocKey = resolveActiveVerifyDocKey({
    activeTopTab,
    activeSubTab,
    activeDivPayer,
    activeIntPayer,
  })

  const handleOpenScheduleC = useCallback(() => {
    setShow1040(true)
    setOutputFormId('schC')
    setSelectedField('schC-1')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const row = document.querySelector('[data-field-row="schC-1"]') as HTMLElement | null
        row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    })
  }, [setSelectedField, setOutputFormId, setShow1040])

  // Scroll the mapped output row into view when a source field is selected and outputs are visible
  useEffect(() => {
    if (!show1040 || !highlightField1040) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const row = document.querySelector(
          `[data-field-row="${highlightField1040}"]`,
        ) as HTMLElement | null
        row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    })
  }, [show1040, highlightField1040, selectedField])

  const sourceDocPreview = getSourceDocPreview({
    activeTopTab,
    activeSubTab,
    activeIntPayer,
    activeDivPayer,
    prior1040Images: [img1040PriorPage1, img1040PriorPage2],
    manualAttachments,
  })

  // Reset field selection on mount
  useEffect(() => {
    setSelectedField(null)
  }, [])

  // ProtoC: the agent panel is driven by the phase model (opens on entering Phase 2),
  // not by the ?agent=true entry param. See handleBeginDiagnostics below.

  const handleAgentOpen = (subView?: 'overview' | 'yoyDetail') => {
    setSelectedField(null)
    if (subView) setAgentSubView(subView)
    openRightPanel('ai')
    const alreadyLoaded = sessionStorage.getItem('agentLoaded')
    if (alreadyLoaded) {
      setAgentView('report')
    } else {
      setAgentView('loading')
      setTimeout(() => {
        setAgentView('report')
        sessionStorage.setItem('agentLoaded', '1')
      }, 3200)
    }
  }

  // ProtoC: Phase 1 → Phase 2 transition. Switches layout to agent-primary and
  // opens the AI diagnostics panel (plays the loading animation once).
  const handleBeginDiagnostics = () => {
    dismissContinueDiagnosticsCoach()
    setPhase('diagnostics')
    setShow1040(true)          // 1040 visible by default in Phase 2 (context for diagnostics)
    setSelectedField(null)
    handleAgentOpen()
  }

  // ProtoC: return to Phase 1 (source docs) from the completion banner
  const handleReturnToImport = () => {
    if (agentPanelActive) handleAgentClose()
    setPhase('import')
    setShow1040(true)
    setSelectedField(null)
  }

  const handleAgentClose = (preserveSelection = false) => {
    if (rightPanelMode === 'ai+sources') {
      setRightPanelMode('sources')
      setAgentView('idle')
      setYoyExpanded(false)
      return
    }
    setAgentView('closing')
    setYoyExpanded(false)
    if (!preserveSelection) {
      setSelectedField(null)
      setActiveIssueField(null)
    }
    setTimeout(() => {
      setAgentView('idle')
      if (preserveSelection) {
        setRightPanelMode('sources')
        animatePanelEnter()
      } else {
        setRightPanelMode('closed')
      }
    }, 350)
  }

  const handleOpenNotes = () => {
    // Mutual exclusion: Comments ↔ Summary
    
    openRightPanel('comments')
  }
  const handleCloseNotes = () => {
    if (rightPanelMode === 'comments') closeRightPanel()
  }
  const formatNoteAt = () =>
    new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

  const handleAddNote = (text: string, context?: string) => {
    setNotes(prev => [...prev, {
      id: `note-${Date.now()}`,
      text,
      author: getReviewActor(),
      at: formatNoteAt(),
      context,
      status: 'open',
      role: reviewRole,
      replies: [],
    }])
    
    openRightPanel('comments')
  }

  const handleEditNote = (id: string, text: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text, at: formatNoteAt() } : n))
  }

  const handleResolveNote = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, status: 'resolved' as const } : n))
  }

  const handleReplyNote = (id: string, text: string) => {
    setNotes(prev => prev.map(n => {
      if (n.id !== id) return n
      const reply = {
        id: `reply-${Date.now()}`,
        text,
        author: getReviewActor(),
        at: formatNoteAt(),
        role: reviewRole,
      }
      return { ...n, replies: [...(n.replies ?? []), reply] }
    }))
  }

  const pass2DocConfirmOpenCount = reviewRole === 'reviewer'
    ? countDocsIncompleteForReviewer({
        verifiedDocs,
        reviewerConfirmedDocs,
        docKeys: EXPECTED_SOURCE_DOCS,
      })
    : 0

  const buildSnapshot = (
    mode: HandoffMode,
    pass: 1 | 2 = reviewPass,
    actor = actorLabel,
    voice: 'self' | 'reviewer-briefing' = 'self',
  ): HandoffSnapshot =>
    buildHandoffSnapshot(mode, pass, actor, {
      reviewedFields,
      verifiedDocs,
      verifiedDocsMeta,
      reviewerConfirmedDocs,
      reviewerConfirmedDocsMeta,
      editedFields: editedFieldsMeta,
      summaryChecked: summaryCheckedMeta,
      reviewerConfirmed: reviewerConfirmedMeta,
      summaryFlagged: summaryFlaggedMeta,
      summaryFlagNotes,
      notes,
      amounts,
    }, { voice })

  const openSummaryPanel = (
    mode: HandoffMode = 'signoff-review',
    opts: { pass?: 1 | 2; actor?: string; voice?: HandoffVoice } = {},
  ) => {
    setSummaryMode(mode)
    setSummaryOpts(opts)
    setAgentView('idle')
    setYoyExpanded(false)
    const body = bodyRef.current
    if (body) {
      setBodyWidth(body.clientWidth || body.getBoundingClientRect().width)
    }
    setRightPanelWidth(SUMMARY_PANEL_WIDTH)
    openRightPanel('summary')
  }

  const handleCloseSummaryPanel = () => {
    if (rightPanelMode === 'summary') closeRightPanel()
  }

  /** Sign-off CTA (Phase 2 banner, preparer) → Smart review brief panel */
  const handleWrapUpPass = () => {
    if (reviewRole === 'reviewer') {
      openSummaryPanel('signoff-review', { pass: 2, actor: REVIEWER_NAME, voice: 'self' })
      return
    }
    openSummaryPanel('signoff-review')
  }

  const handlePreviewFinishAndFile = () => {
    setPreparerHandoffChoice('finish-and-file')
    openSummaryPanel('finish-and-file', summaryOpts)
  }

  const handleConfirmHandoffSend = () => {
    setPreparerHandoffChoice('awaiting-reviewer')
    openSummaryPanel('awaiting-reviewer', summaryOpts)
  }

  /** Jump from summary — peer panels replace Summary when they would overlap */
  const handleHandoffJump = useCallback((jump: HandoffJump) => {
    if (jump.type === 'notesPane' || jump.type === 'note') {
      if (jump.type === 'note') setFocusNoteId(jump.noteId)
      
      openRightPanel('comments')
      return
    }
    if (jump.type === 'field') {
      // Phase 1 flag keys → source detail field; otherwise try summary / 1040 row
      const fromFlag = PHASE1_VERIFY_QUEUE.find(q => q.flagKey === jump.field)
      if (fromFlag) {
        applyVerifyNavigation(fromFlag.field)
        return
      }
      const mapped = field1040ToDetail(jump.field)
      if (mapped) {
        applyVerifyNavigation(mapped.field)
        return
      }
      const detailNav = navigationForDetailField(jump.field)
      if (detailNav) {
        applyVerifyNavigation(jump.field)
        return
      }
      setSelectedField(jump.field)
      setShow1040(true)
      setOutputFormId('summary')
      requestAnimationFrame(() => {
        document.querySelector(`[data-field-row="${jump.field}"]`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      })
      return
    }
    if (jump.type === 'doc') {
      
      handleNavigateToSourceDoc(jump.docId)
      return
    }
    if (jump.type === 'diagnostic') {
      setPhase('diagnostics')
      openRightPanel('ai')
      setAgentView('report')
      return
    }
    if (jump.type === 'outputForm') {
      setShow1040(true)
      setOutputFormId(jump.formId as OutputFormId)
      return
    }
  }, [
    handleNavigateToSourceDoc,
    setSelectedField,
    setOutputFormId,
    applyVerifyNavigation,
    openRightPanel,
  ])

  /** Canonical chrome entry — Review log (pass-aware content, unified two-tab drawer) */
  const handleOpenSummaryReport = () => {
    if (reviewRole === 'reviewer') {
      if (reviewPass === 1) {
        openSummaryPanel('signoff-review', {
          pass: 1,
          actor: pass1ActorLabel,
          voice: 'reviewer-briefing',
        })
      } else {
        openSummaryPanel('signoff-review', {
          pass: 2,
          actor: REVIEWER_NAME,
          voice: 'self',
        })
      }
      return
    }
    openSummaryPanel('signoff-review')
  }

  /** Transition from Pass 1 briefing into Pass 2 strategic checklist (Tab 1 default). */
  const handleBeginPass2Review = () => {
    setReviewerReviewStarted(true)
    setReviewPass(2)
    setReviewRole('reviewer')
    setReviewActor(REVIEWER_NAME)
    setPhase('diagnostics')
    setShow1040(true)
    setOutputFormId('summary')
    openSummaryPanel('signoff-review', {
      pass: 2,
      actor: REVIEWER_NAME,
      voice: 'self',
    })
  }

  /** Switch demo chrome to reviewer — returns to SmartReturn landing */
  const handleSwitchToReviewerRole = () => {
    navigate('/smart-return?role=reviewer')
  }

  /** Header CTA — reviewer lands directly on Pass 2 strategic checklist */
  const handleReviewReturn = () => {
    setReviewerReviewStarted(true)
    setReviewRole('reviewer')
    setReviewActor(REVIEWER_NAME)
    setReviewPass(2)
    setPhase('diagnostics')
    setShow1040(true)
    setOutputFormId('summary')
    openSummaryPanel('signoff-review', {
      pass: 2,
      actor: REVIEWER_NAME,
      voice: 'self',
    })
    setSummaryBriefEnterAnim(true)
    setNotes(prev => {
      if (prev.length > 0) return prev
      return [{
        id: 'note-seed-pass1',
        text: 'Please confirm NIIT Form 8960 still applies after AGI tweak. SC',
        author: PREPARER_NAME,
        at: formatNoteAt(),
        context: 'Form 8960',
        status: 'open',
        role: 'preparer',
        replies: [],
      }]
    })
  }

  // Preparer entry (Import confirmation / Input return tab): Return Summary full width, panels closed.
  // Only wipe synced state on first-time session or explicit Reset demo — not on Input ↔ Data review hops.
  useEffect(() => {
    if (!isPreparerEntry) return

    const sessionStarted = sessionStorage.getItem(SESSION_STARTED_KEY) === '1'
    let hasPersistedReview = false
    try {
      hasPersistedReview = !!localStorage.getItem(STORAGE_KEY)
    } catch {
      hasPersistedReview = false
    }

    const isFreshSession = !sessionStarted && !hasPersistedReview

    if (isFreshSession && !launchDiagnostics) {
      resetReviewState()
      setNotes([])
      try { localStorage.removeItem(NOTES_KEY) } catch { /* ignore */ }
      sessionStorage.setItem(SESSION_STARTED_KEY, '1')
      sessionStorage.setItem(SESSION_IMPORTS_KEY, '0')
      sessionStorage.setItem(SESSION_PHASE_KEY, 'import')
    } else if (isFreshSession && launchDiagnostics) {
      sessionStorage.setItem(SESSION_STARTED_KEY, '1')
      sessionStorage.setItem(SESSION_IMPORTS_KEY, '1')
      sessionStorage.setItem(SESSION_PHASE_KEY, 'diagnostics')
      setImportsStarted(true)
      setPhase('diagnostics')
    } else {
      const savedImports = sessionStorage.getItem(SESSION_IMPORTS_KEY) === '1'
      const savedPhase = sessionStorage.getItem(SESSION_PHASE_KEY)
      if (launchDiagnostics) {
        setImportsStarted(true)
        setPhase('diagnostics')
      } else {
        setImportsStarted(savedImports)
        if (savedPhase === 'import' || savedPhase === 'diagnostics') {
          setPhase(savedPhase)
        }
      }
    }

    setReviewRole('preparer')
    setReviewPass(1)
    setReviewActor(PREPARER_NAME)
    setReviewerReviewStarted(false)
    if (isFreshSession && !launchDiagnostics) {
      setPhase('import')
      setImportsStarted(false)
      setSelectedField(null)
      setSummaryMode('signoff-review')
      setSummaryOpts({})
      setRightPanelExiting(false)
      setPanelClosing(false)
      setRightPanelMode('closed')
      setOutputSourcesCoach(false)
      setCoachTip(null)
      try { sessionStorage.removeItem('protoc-coach-tip:outputSourcesFirst') } catch { /* ignore */ }
    }
    setShow1040(true)
    setOutputFormId('summary')
  }, [entry, roleParam, isPreparerEntry, location.key, resetReviewState, launchDiagnostics])

  // Persist preparer UI progress across Input return ↔ Data review navigation
  useEffect(() => {
    if (!isPreparerEntry) return
    sessionStorage.setItem(SESSION_IMPORTS_KEY, importsStarted ? '1' : '0')
    sessionStorage.setItem(SESSION_PHASE_KEY, phase)
  }, [importsStarted, phase, isPreparerEntry, SESSION_IMPORTS_KEY, SESSION_PHASE_KEY])

  // Auto-start review when navigated from SmartReturn header CTA
  const startReviewHandled = useRef(false)
  useEffect(() => {
    if (!startReviewParam || startReviewHandled.current || !entry) return
    startReviewHandled.current = true
    handleReviewReturn()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on entry from SmartReturn
  }, [startReviewParam, entry])

  // Launch point: ?phase=diagnostics opens Phase 2 and AI panel (bypasses Phase 1 lock).
  const diagnosticsLaunchKey = useRef<string | null>(null)
  useEffect(() => {
    if (!isPreparerEntry || !launchDiagnostics) return
    if (diagnosticsLaunchKey.current === location.key) return
    diagnosticsLaunchKey.current = location.key
    handleBeginDiagnostics()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per navigation
  }, [launchDiagnostics, isPreparerEntry, location.key])

  // End staged brief reveal after animation completes
  useEffect(() => {
    if (!summaryBriefEnterAnim) return
    const timer = window.setTimeout(() => setSummaryBriefEnterAnim(false), 2800)
    return () => window.clearTimeout(timer)
  }, [summaryBriefEnterAnim])

  const handoffSnapshot: HandoffSnapshot | null =
    rightPanelMode === 'summary'
      ? buildSnapshot(
          summaryMode,
          summaryOpts.pass ?? reviewPass,
          summaryOpts.actor ?? actorLabel,
          summaryOpts.voice ?? 'self',
        )
      : null


  /**
   * Shared drag bootstrap: pointer events + document-level move/up while dragging.
   * Falls back cleanly if the gesture was not a primary button press.
   */
  const beginPanelDrag = useCallback((
    e: React.PointerEvent,
    cursor: string,
    onMove: (clientX: number, clientY: number) => void,
  ) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture?.(e.pointerId)
    setPanelResizing(true)
    document.body.style.cursor = cursor
    document.body.style.userSelect = 'none'

    const onPointerMove = (moveEvent: PointerEvent) => {
      onMove(moveEvent.clientX, moveEvent.clientY)
    }
    const onPointerUp = (upEvent: PointerEvent) => {
      try { target.releasePointerCapture?.(upEvent.pointerId) } catch { /* already released */ }
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setPanelResizing(false)
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
  }, [])

  // Horizontal drag between left panel and agent panel (resizes agent panel px width).
  // Keep Summary ≥ LEFT_PANEL_MIN_WIDTH (795.7px) so breakdown labels aren’t truncated.
  const handleAgentDrag = useCallback((e: React.PointerEvent) => {
    const body = bodyRef.current
    if (!body) return
    const startX = e.clientX
    const startPanelWidth = agentPanelWidth
    beginPanelDrag(e, 'col-resize', (clientX) => {
      const delta = startX - clientX // dragging left = wider agent panel
      const bodyW = body.getBoundingClientRect().width
      const minSources = RIGHT_PANEL_MIN_WIDTH
      const preferredMax = diagnosticsSourceSplit
        ? bodyW - minSources - PANEL_DRAG_HANDLE_WIDTH
        : bodyW - LEFT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH
      const upper = Math.min(bodyW * 0.7, Math.max(0, preferredMax))
      const floor = Math.min(360, upper)
      const next = startPanelWidth + delta
      setAgentPanelWidth(Math.max(floor, Math.min(upper, next)))
    })
  }, [agentPanelWidth, beginPanelDrag, diagnosticsSourceSplit])

  // Horizontal drag between left panel and right panel (resizes rightPanelWidth).
  // Keep Summary ≥ LEFT_PANEL_MIN_WIDTH (795.7px) so breakdown labels aren’t truncated.
  const handleRightPanelDrag = useCallback((e: React.PointerEvent) => {
    const body = bodyRef.current
    if (!body) return
    const startX = e.clientX
    const startPanelWidth = rightPanelWidth
    beginPanelDrag(e, 'col-resize', (clientX) => {
      const delta = startX - clientX // dragging left = wider right panel
      const bodyW = body.getBoundingClientRect().width
      const preferredMax = bodyW - LEFT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH
      const upper = Math.min(bodyW * 0.75, Math.max(0, preferredMax))
      const floor = Math.min(RIGHT_PANEL_MIN_WIDTH, upper)
      const next = startPanelWidth + delta
      setRightPanelWidth(Math.max(floor, Math.min(upper, next)))
    })
  }, [rightPanelWidth, beginPanelDrag])

  // Keep bodyWidth in sync (Sources share of row uses rightPanelWidth / bodyWidth).
  // Prefer clientWidth (scrollport) so overflowed content min-sizes don't inflate the ratio.
  // Re-bind when phase changes so ProtoC attaches after leaving welcome (body mounts).
  useEffect(() => {
    const body = bodyRef.current
    if (!body || typeof ResizeObserver === 'undefined') return
    const update = () => setBodyWidth(body.clientWidth || body.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(body)
    return () => ro.disconnect()
  }, [phase])

  // Clamp Sources width when the viewport shrinks so Summary stays ≥ LEFT_PANEL_MIN_WIDTH.
  useEffect(() => {
    if (bodyWidth <= 0 || rightPanelMode === 'closed' || rightPanelMode === 'ai' || rightPanelMode === 'ai+sources' || rightPanelMode === 'summary') return
    const maxRight = Math.max(0, bodyWidth - LEFT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH)
    setRightPanelWidth((w) => Math.min(w, maxRight))
  }, [bodyWidth, rightPanelMode])

  // Side-by-side (doc LEFT / Details RIGHT) when:
  //   1. Hide Summary (!show1040), OR
  //   2. Sources (right) panel is >60% of review body width
  // Stacked (preview TOP / Details BOTTOM) when Summary is visible AND
  // Sources panel is ≤60% of body.
  // freezePreviewSideBySide holds orientation steady during Hide/Show Summary.
  const sourcesPanelWide =
    (rightPanelMode === 'sources' || diagnosticsSourceSplit) &&
    !rightPanelExiting &&
    bodyWidth > 0 &&
    (diagnosticsSourceSplit
      ? (bodyWidth - agentPanelWidth - PANEL_DRAG_HANDLE_WIDTH) / bodyWidth > 0.6
      : rightPanelWidth / bodyWidth > 0.6)
  const previewSideBySide = freezePreviewSideBySide || !show1040 || sourcesPanelWide

  const hideRightRailForPopout = poppedOut && rightPanelMode === 'sources'

  const handlePopOutSourcePanel = useCallback(() => {
    setPoppedOut(true)
    const popoutWindow = window.open(
      buildHashRouteUrl('/data-review-popout'),
      '_blank',
      'width=950,height=900',
    )
    if (popoutWindow) {
      const checkClosed = window.setInterval(() => {
        if (popoutWindow.closed) {
          window.clearInterval(checkClosed)
          setPoppedOut(false)
        }
      }, 500)
    }
  }, [])


  const outstandingOpenCount = getOutstandingOpenCount(buildSnapshot('signoff-review'))

  const inImportPhase = phase === 'import'

  const reviewChecklist = deriveReviewChecklist({
    reviewedFields,
    verifiedDocs,
    reviewerConfirmedDocs,
    summaryCheckedFields,
    reviewerConfirmedFields,
    reviewerConfirmStaleFields,
    reviewerSignedOffForms,
    amounts,
    manualChecklistItems,
    outstandingOpenCount,
  })

  const singlePersonMode = reviewPass === 1

  const milestoneState = deriveMilestoneState({
    verifiedDocs,
    reviewerConfirmedDocs,
    summaryCheckedFields,
    reviewerConfirmedFields,
    reviewerConfirmStaleFields,
    reviewerSignedOffForms,
    verifiedDocsMeta,
    reviewerConfirmedDocsMeta,
    reviewerSignedOffFormsMeta,
    amounts,
    reviewedFields,
    completedMilestones,
    outstandingOpenCount,
    currentActorName: getReviewActor(),
    reviewPass,
    singlePersonMode,
  })

  /** Source Documents toolbar badge — unreviewed packet docs (preparer Phase 1). */
  const sourceDocsBadgeCount = (() => {
    if (reviewRole === 'preparer' && inImportPhase) {
      return unreviewedDocCount
    }
    if (reviewRole === 'reviewer' && reviewPass === 2) {
      return pass2DocConfirmOpenCount
    }
    return 0
  })()

  /** Checklist pending badge — reviewer only (Review log toolbar). */
  const isReviewerBriefing = (summaryOpts.voice ?? 'self') === 'reviewer-briefing'
  const showChecklist = !isReviewerBriefing

  const summaryBadgeCount = (() => {
    if (reviewRole !== 'reviewer') return 0
    if (!showChecklist) return 0
    const brief = buildSmartReviewBrief({
      snapshot: buildSnapshot('signoff-review'),
      checklist: reviewChecklist,
      milestoneState,
      outstandingOpenCount,
      manualChecklistItems,
      reviewPass,
      showStrategicChecklist: true,
      isPreparer: reviewRole === 'preparer',
      amounts,
      singlePersonMode,
    })
    return countStrategicOpenItems(brief.phases)
  })()

  const signOffGatingActive = !inImportPhase && reviewRole === 'reviewer'
  const briefForGating = buildSmartReviewBrief({
    snapshot: buildSnapshot('signoff-review'),
    checklist: reviewChecklist,
    milestoneState,
    outstandingOpenCount,
    manualChecklistItems,
    reviewPass,
    showStrategicChecklist: showChecklist,
    isPreparer: reviewRole === 'preparer',
    amounts,
    singlePersonMode,
  })
  const signOffReady = !signOffGatingActive || (
    showChecklist
      ? canApproveSignOff(briefForGating)
      : canSignOffFromMilestones(milestoneState, outstandingOpenCount)
  )
  const signOffBlockerMessage = signOffGatingActive
    ? signOffBlockerFromMilestones(milestoneState, outstandingOpenCount)
    : null

  // Resize drag between the document preview and detail fields. Axis is frozen
  // for the gesture (matches flexDirection at pointer-down). previewHeight
  // only controls the split ratio — never orientation.
  const handlePreviewDrag = useCallback((e: React.PointerEvent) => {
    const split = splitPaneRef.current ?? rightRef.current
    if (!split) return

    // Freeze axis to the layout at pointer-down (matches flexDirection).
    const stacked = !previewSideBySide
    const startPos = stacked ? e.clientY : e.clientX
    const startSize = previewHeight
    beginPanelDrag(e, stacked ? 'row-resize' : 'col-resize', (clientX, clientY) => {
      const pos = stacked ? clientY : clientX
      const delta = pos - startPos
      const rect = split.getBoundingClientRect()
      const splitSize = stacked ? rect.height : rect.width
      if (splitSize <= 0) return
      setPreviewHeight(Math.max(20, Math.min(75, startSize + (delta / splitSize) * 100)))
    })
  }, [previewHeight, previewSideBySide, beginPanelDrag])

  // While Summary is animating or collapsed, right/agent panel flex-fills
  const panelUsesAgentWidth = rightPanelMode === 'ai' || diagnosticsSourceSplit
  const activePanelWidth = panelUsesAgentWidth ? agentPanelWidth : rightPanelWidth
  const shellHidden = !rightPanelOpen && !rightPanelExiting
  const rightPanelFills = (!show1040 || leftAnimWidth !== null || diagnosticsSourceSplit) && rightPanelOpen

  const handleHideSummary = useCallback(() => {
    const rightPanelClosed =
      rightPanelMode === 'closed' && !rightPanelExiting && !panelClosing
    if (rightPanelClosed) return

    const body = bodyRef.current
    const left = leftPanelRef.current
    if (!body) {
      setShow1040(false)
      return
    }
    const bodyW = body.clientWidth || body.getBoundingClientRect().width
    const leftW = left?.getBoundingClientRect().width
      ?? Math.max(0, bodyW - rightPanelWidth - PANEL_DRAG_HANDLE_WIDTH)
    preCollapseRightWidthRef.current = rightPanelWidth
    // If doc|Details is already side-by-side, keep that axis for the whole motion.
    if (previewSideBySide) setFreezePreviewSideBySide(true)

    // Frame 1: lock left at its current pixel width (right switches to flex-fill
    // via leftAnimWidth !== null) — visually identical, no reflow jump.
    setLeftAnimWidth(leftW)
    if (summaryToggleTimerRef.current) clearTimeout(summaryToggleTimerRef.current)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShow1040(false)
        setLeftAnimWidth(0)
      })
    })

    summaryToggleTimerRef.current = setTimeout(() => {
      setLeftAnimWidth(null)
      setFreezePreviewSideBySide(false)
      summaryToggleTimerRef.current = null
    }, SUMMARY_TOGGLE_MS)
  }, [previewSideBySide, rightPanelWidth, rightPanelMode, rightPanelExiting, panelClosing])

  /**
   * First-time only: collapse outputs and point at Show outputs when focusing
   * source docs (banner CTA / popover). Later opens keep Summary visible.
   */
  const hideOutputsForSourceFocus = useCallback(() => {
    if (readCoachTipShown('showOutputs')) return
    if (show1040) {
      if (coachTip === 'hideSummary') dismissCoachTip('hideSummary')
      else if (!readCoachTipShown('hideSummary')) markCoachTipShown('hideSummary')
      handleHideSummary()
    }
    markCoachTipShown('showOutputs')
    setCoachTip('showOutputs')
  }, [show1040, coachTip, dismissCoachTip, handleHideSummary])
  hideOutputsForSourceFocusRef.current = hideOutputsForSourceFocus

  const handleShowSummary = useCallback(() => {
    const body = bodyRef.current
    const bodyW = body
      ? (body.clientWidth || body.getBoundingClientRect().width)
      : window.innerWidth
    const restoreWidth = preCollapseRightWidthRef.current
      ?? Math.max(480, Math.round(bodyW * 0.65))
    const targetLeft = Math.max(0, bodyW - restoreWidth - PANEL_DRAG_HANDLE_WIDTH)
    // Keep side-by-side frozen when restoring into a wide Sources layout.
    if (restoreWidth / bodyW > 0.6) setFreezePreviewSideBySide(true)

    setLeftAnimWidth(0)
    setShow1040(true)
    if (summaryToggleTimerRef.current) clearTimeout(summaryToggleTimerRef.current)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLeftAnimWidth(targetLeft)
        setRightPanelWidth(restoreWidth)
      })
    })

    summaryToggleTimerRef.current = setTimeout(() => {
      setLeftAnimWidth(null)
      setFreezePreviewSideBySide(false)
      preCollapseRightWidthRef.current = null
      summaryToggleTimerRef.current = null
    }, SUMMARY_TOGGLE_MS)
  }, [])
  handleShowSummaryRef.current = handleShowSummary

  const handleCloseSourcePanel = useCallback(() => {
    if (rightPanelMode === 'ai+sources') {
      setRightPanelMode('ai')
      setFromAgent(false)
      handleShowSummary()
      return
    }
    if (rightPanelMode === 'sources') closeRightPanel()
  }, [rightPanelMode, closeRightPanel, handleShowSummary])

  /** Phase 2: keep AI diagnostics open while showing source docs — hide Summary/outputs. */
  const openDiagnosticsSourceSplit = useCallback(() => {
    setFromAgent(true)
    setAgentView('report')
    const body = bodyRef.current
    const bodyW = body
      ? (body.clientWidth || body.getBoundingClientRect().width)
      : window.innerWidth
    const preferredAgent = Math.round(bodyW * 0.33)
    const maxAgent = Math.max(360, Math.min(Math.round(bodyW * 0.45), bodyW - RIGHT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH * 2))
    setAgentPanelWidth(Math.max(360, Math.min(preferredAgent, maxAgent)))
    if (rightPanelMode === 'closed') {
      openRightPanel('ai+sources')
    } else {
      setRightPanelMode('ai+sources')
    }
    setPreviewHeight(58)
    if (!importsStarted && reviewRole === 'preparer') {
      setImportsStarted(true)
    }
    if (show1040) handleHideSummary()
  }, [show1040, handleHideSummary, rightPanelMode, openRightPanel, importsStarted, reviewRole])
  openDiagnosticsSourceSplitRef.current = openDiagnosticsSourceSplit

  /**
   * Lighter empty-canvas fix: when the user closes the last right-rail panel while
   * outputs are hidden, restore Return Summary. Only fires on panel close (open→closed),
   * not when hiding outputs with the panel already closed — preserves full-width Sources
   * and coach-tip hide/show flows.
   */
  useEffect(() => {
    const wasOpen = prevRightPanelOpenRef.current
    const isOpen = rightPanelOpen
    prevRightPanelOpenRef.current = isOpen

    if (!wasOpen || isOpen || show1040) return

    const timer = setTimeout(() => {
      if (
        show1040 ||
        rightPanelMode !== 'closed' ||
        rightPanelExiting ||
        panelClosing ||
        leftAnimWidth !== null
      ) {
        return
      }
      handleShowSummary()
    }, 50)

    return () => clearTimeout(timer)
  }, [
    rightPanelOpen,
    show1040,
    rightPanelMode,
    rightPanelExiting,
    panelClosing,
    leftAnimWidth,
    handleShowSummary,
  ])

  // ProtoC: preparer skips welcome — lands in import phase, Return Summary full width, panels closed
  if (!entryValid) return null

  const summaryPanelLabel = 'Review log'
  const isReviewerConfirmMode = reviewRole === 'reviewer'
  /** ProtoC Phase 1 banner — visible for entire preparer import phase (CTA before sources open). */
  const showPreparerImportPhase = inImportPhase && reviewRole === 'preparer'
  /** Preparer Phase 1: hide Source documents until review starts (banner CTA is the entry). */
  const showSourceDocsToolbar =
    (reviewRole !== 'reviewer' || reviewerReviewStarted) &&
    !(showPreparerImportPhase && !importsStarted)
  /** Badge on toolbar after imports start — flag count lives on Phase1Banner. */
  const showSourceDocsToolbarBadge =
    showSourceDocsToolbar && importsStarted && sourceDocsBadgeCount > 0
  /** Left outputs share row with Smart review brief — allow flex shrink (avoid 795px + 755px overflow). */
  const outputsShareWithBrief = summaryPanelOpen && show1040
  return (
    <div className={styles.page}>
      {/* Header — title + peer icon controls (Sign-off lives on Step 2 banner) */}
      <div className={styles.headerBlock}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTitle}>Data Review - Form 1040</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.headerIconGroup}>
              <span className={styles.headerIconWrap}>
                <IconControl
                  label="Comments"
                  size="medium"
                  selected={notesOpen}
                  aria-label="Comments"
                  onClick={notesOpen ? handleCloseNotes : handleOpenNotes}
                >
                  <CommentDots size="medium" />
                </IconControl>
                {notes.length > 0 && (
                  <AttentionCountBadge count={notes.length} className={styles.toolbarBadge} aria-hidden />
                )}
              </span>
              <span className={styles.headerIconWrap}>
                <IconControl
                  label={summaryPanelLabel}
                  size="medium"
                  selected={summaryPanelOpen}
                  aria-label={
                    summaryBadgeCount > 0
                      ? `${summaryPanelLabel}, ${summaryBadgeCount} checklist item${summaryBadgeCount === 1 ? '' : 's'} remaining`
                      : summaryPanelLabel
                  }
                  onClick={
                    summaryPanelOpen ? handleCloseSummaryPanel : handleOpenSummaryReport
                  }
                >
                  <ClockCounterclockwise size="medium" />
                </IconControl>
                {summaryBadgeCount > 0 && (
                  <AttentionCountBadge count={summaryBadgeCount} className={styles.toolbarBadge} aria-hidden />
                )}
              </span>
            </div>
            {(reviewRole !== 'reviewer' || reviewerReviewStarted) && showSourceDocsToolbar && (
            <button
              className={`${styles.intuitIntelBtn} ${rightPanelVisible && !agentPanelActive ? styles.intuitIntelBtnActive : ''}`}
              aria-label={
                showSourceDocsToolbarBadge && sourceDocsBadgeCount > 0
                  ? `Source documents panel, ${sourceDocsBadgeCount} unreviewed document${sourceDocsBadgeCount === 1 ? '' : 's'}`
                  : 'Toggle source documents panel'
              }
              style={{ position: 'relative' }}
              onClick={() => {
                if (phase === 'diagnostics') {
                  if (rightPanelMode === 'ai+sources') {
                    setRightPanelMode('ai')
                    setFromAgent(false)
                    handleShowSummary()
                  } else {
                    setFromAgent(true)
                    openDiagnosticsSourceSplit()
                  }
                  return
                }
                if (agentPanelActive) {
                  handleAgentClose()
                } else if (rightPanelMode === 'comments' || rightPanelMode === 'summary') {
                  openRightPanel('sources')
                } else if (rightPanelMode === 'sources') {
                  closeRightPanel()
                } else {
                  openRightPanel('sources')
                }
              }}
            >
              <Panel size="medium" />
              <span className={styles.intuitIntelLabel}>Source documents</span>
              {showSourceDocsToolbarBadge && sourceDocsBadgeCount > 0 && (
                <DocumentCountBadge count={sourceDocsBadgeCount} className={styles.toolbarBadge} aria-hidden />
              )}
            </button>
            )}
            {/* ProtoC: AI Review is Phase 2 only — hidden during Phase 1 (import accuracy) */}
            {!inImportPhase && (
              <button
                className={`${styles.intuitIntelBtn} ${agentPanelActive ? styles.intuitIntelBtnActive : ''}`}
                aria-label={
                  !agentPanelActive && phase2Progress.remaining > 0
                    ? `AI diagnostics, ${phase2Progress.reviewed} of ${phase2Progress.total} diagnostics reviewed, ${phase2Progress.remaining} diagnostics remaining`
                    : 'AI diagnostics'
                }
                style={{ position: 'relative' }}
                onClick={() => handleAgentOpen()}
              >
                <img src={intuitAssistIcon} alt="" className={styles.intuitIntelIcon} />
                <span className={styles.intuitIntelLabel}>AI diagnostics</span>
                {!agentPanelActive && phase2Progress.remaining > 0 && (
                  <AttentionCountBadge count={phase2Progress.remaining} className={styles.toolbarBadge} aria-hidden />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ProtoC Phase 1 — Import Accuracy banner (preparer only) */}
      {showPreparerImportPhase && (
        <Phase1Banner
          flagsResolved={phase1FlagsResolved}
          flagsTotal={phase1FlagsTotal}
          verifiedDocCount={verifiedDocCount}
          totalDocCount={totalDocCount}
          flagsCleared={flagsCleared}
          unreviewedDocCount={unreviewedDocCount}
          complete={phase1FullyComplete}
          onContinue={handleBeginDiagnostics}
          importsStarted={importsStarted}
          onStartImports={startReviewingImports}
          continueCoachOpen={continueDiagnosticsCoach}
          onDismissContinueCoach={dismissContinueDiagnosticsCoach}
        />
      )}

      {/* ProtoC Phase 2 — AI Diagnostics banner. Shares Phase1Banner's visual language
          (Intuit Assist icon, title/subtitle, progress) so both phases feel like one
          continuous guided experience rather than two disconnected screens. */}
      {!inImportPhase && (
        <Phase2Banner
          reviewed={phase2Reviewed}
          total={phase2Total}
          complete={phase2Complete}
          diagnosticsOpen={agentPanelActive}
          onOpenDiagnostics={() => handleAgentOpen()}
          checklistProgress={
            signOffGatingActive
              ? { complete: milestoneState.requiredCompleteCount, total: milestoneState.requiredTotal }
              : undefined
          }
          signOffSlot={
            reviewRole === 'preparer' ? (
              <Button
                priority="primary"
                size="medium"
                onClick={handleWrapUpPass}
                automationId="phase2-sign-off"
                disabled={signOffGatingActive && !signOffReady}
              >
                Sign-off
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Body — left panel + drag handle + right panel + agent panel */}
      <div className={styles.body} ref={bodyRef}>
        {/* ProtoC Phase 1: 1040 is minimized by default — collapsed to a compact button
            pinned near the top of the column. Expanding grows the panel horizontally, so
            the chevron points right (expand) / left (collapse) rather than up/down. Left
            panel stays mounted and animates width/opacity (same pattern as .rightPanel)
            so the transition is smooth. */}
        {/* Collapsed "Show outputs" edge tab — available in import and AI phases */}
        <div
          className={`${styles.form1040HandleWrap} ${coachTip === 'showOutputs' && !show1040 ? styles.form1040HandleWrapCoach : ''}`}
          style={{
            width: show1040 ? 0 : SHOW_SUMMARY_HANDLE_WIDTH,
            opacity: show1040 ? 0 : 1,
            pointerEvents: show1040 ? 'none' : 'auto',
            transition: panelResizing ? 'none' : undefined,
          }}
        >
          <CoachTip
            open={coachTip === 'showOutputs' && !show1040}
            title="Show outputs"
            message="Bring Summary back anytime with Show outputs."
            onClose={() => dismissCoachTip('showOutputs')}
            position="left"
            alignment="middle"
          >
            <button
              type="button"
              className={styles.form1040Handle}
              onClick={() => {
                if (coachTip === 'showOutputs') dismissCoachTip('showOutputs')
                handleShowSummary()
              }}
              aria-label="Show outputs"
            >
              <ChevronRight size="small" className={styles.form1040HandleIcon} />
              <span className={styles.form1040HandleLabel}>Show outputs</span>
            </button>
          </CoachTip>
        </div>
        <div
          ref={leftPanelRef}
          className={styles.outputsColumn}
          style={{
            /* During toggle, drive an explicit px width so min-width→0 and collapse
               interpolate together; otherwise flex:1 grows into remaining space. */
            flex: leftAnimWidth !== null
              ? `0 0 ${leftAnimWidth}px`
              : !show1040 ? '0 0 0px'
              : outputsShareWithBrief || bothPanelsOpen ? '1 1 0%'
              : 1,
            width: leftAnimWidth !== null
              ? leftAnimWidth
              : !show1040 ? 0 : undefined,
            opacity: !show1040 ? 0 : 1,
            /* Keep Summary ≥ 795.7px so Return Breakdown labels aren’t truncated.
               Collapse animation / Hide output panel / brief-open still use minWidth 0. */
            minWidth: leftAnimWidth !== null || !show1040 || outputsShareWithBrief || bothPanelsOpen
              ? 0
              : LEFT_PANEL_MIN_WIDTH,
            transition: panelResizing ? 'none' : undefined,
          }}
        >
          <div className={styles.leftPanel}>
          <LeftPanel1040
            selectedField={selectedField}
            highlightField={highlightField1040}
            onFieldClick={inImportPhase ? handle1040FieldClick : setSelectedField}
            total1a={total1a}
            wages={wages}
            yoyExpanded={yoyExpanded || agentSubView === 'yoyDetail' || phase === 'diagnostics'}
            reviewedFields={reviewedFields}
            checkedFields={summaryCheckedFields}
            checkedMeta={summaryCheckedMeta}
            reviewerConfirmedFields={reviewerConfirmedFields}
            reviewerConfirmedMeta={reviewerConfirmedMeta}
            reviewerConfirmStaleFields={reviewerConfirmStaleFields}
            onToggleChecked={toggleSummaryChecked}
            onTogglePreparerCheck={toggleSummaryPreparerCheck}
            onToggleReviewerConfirm={toggleSummaryReviewerConfirm}
            reviewRole={reviewRole}
            reviewerSignedOffForms={reviewerSignedOffForms}
            reviewerSignedOffFormsMeta={reviewerSignedOffFormsMeta}
            onToggleFormSignOff={toggleReviewerFormSignOff}
            flaggedFields={summaryFlaggedFields}
            flaggedMeta={summaryFlaggedMeta}
            onToggleFlagged={toggleSummaryFlagged}
            flagNotes={summaryFlagNotes}
            flagActivity={summaryFlagActivity}
            onSetFlagNote={setSummaryFlagNote}
            issueField={issueField}
            activeDiagnosticKey={activeDiagnosticKey}
            liveTotals={liveTotals}
            liveAmounts={amounts}
            editedFields={editedFields}
            outputFormId={outputFormId}
            onOutputFormChange={setOutputFormId}
            outputFormsCoachOpen={outputFormsCoach}
            onDismissOutputFormsCoach={dismissOutputFormsCoach}
            outputSourcesCoachOpen={outputSourcesCoach}
            onDismissOutputSourcesCoach={dismissOutputSourcesCoach}
            onAddFieldNote={(text, context) => handleAddNote(text, context)}
            onNavigateToSourceDoc={handleNavigateToSourceDoc}
            onNavigateSource={handleNavigateSource}
            onViewSource={(fieldName, sourceLabel) => {
              // Map field → document tab
              const tabMap: Record<string, typeof activeTopTab> = {
                wages:           'w2s',
                w2Withholding:   'w2s',
                withholding:     '1099-divs',
                taxableInterest: '1099-ints',
                qualifiedDivs:   '1099-divs',
                ordinaryDivs:    '1099-divs',
                withholding1099: '1099-rs',
                iraDistrib:      '1099-rs',
                otherIncome:     '1099-necs',
                capitalGain:     'w2s',
                stdDeduction:    'w2s',
              }
              const tab = tabMap[fieldName] ?? 'w2s'
              setActiveTopTab(tab)

              // Navigate to the correct W-2 sub-tab based on source label
              if (tab === 'w2s' && sourceLabel) {
                const lc = sourceLabel.toLowerCase()
                if (lc.includes('tech circle')) setActiveSubTab('techCircle')
              }

              if (!importsStarted && reviewRole === 'preparer') {
                startReviewingImports()
              } else if (phase === 'diagnostics') {
                setFromAgent(true)
                openDiagnosticsSourceSplit()
              } else if (rightPanelMode === 'ai') {
                setFromAgent(true)
                setAgentSubView('overview')
                handleAgentClose(true)
              } else {
                ensureSourcePanelVisible()
              }
            }}
          />
          </div>
          {/* Hide outputs — symmetric edge tab when Summary + Sources share the row */}
          <div
            className={`${styles.form1040HideHandleWrap} ${coachTip === 'hideSummary' && bothPanelsOpen ? styles.form1040HideHandleWrapCoach : ''}`}
            style={{
              width: bothPanelsOpen && show1040 ? SHOW_SUMMARY_HANDLE_WIDTH : 0,
              opacity: bothPanelsOpen && show1040 ? 1 : 0,
              pointerEvents: bothPanelsOpen && show1040 ? 'auto' : 'none',
              transition: panelResizing ? 'none' : undefined,
            }}
          >
            <CoachTip
              open={coachTip === 'hideSummary' && bothPanelsOpen}
              title="Hide outputs"
              message="Need more room for source documents? Hide outputs to collapse this panel. Bring it back anytime with Show outputs."
              onClose={() => dismissCoachTip('hideSummary')}
              position="right"
              alignment="middle"
            >
              <button
                type="button"
                className={styles.form1040HideHandle}
                onClick={() => {
                  if (coachTip === 'hideSummary') dismissCoachTip('hideSummary')
                  handleHideSummary()
                }}
                aria-label="Hide outputs"
              >
                <ChevronLeft size="small" className={styles.form1040HandleIcon} />
                <span className={styles.form1040HandleLabel}>Hide outputs</span>
              </button>
            </CoachTip>
          </div>
        </div>

        {/* Left/right drag handle — stays mounted and collapses width with Summary
            so the gutter doesn't pop out of the row mid-animation. */}
        {rightPanelOpen && !rightPanelExiting && show1040 && !hideRightRailForPopout && (
              <div
                className={`${dragStyles.handleVertical} ${styles.summarySplitter}`}
                onPointerDown={show1040 ? (panelUsesAgentWidth ? handleAgentDrag : handleRightPanelDrag) : undefined}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize right panel"
                aria-hidden={!show1040}
                style={{
                  width: !show1040 ? 0 : PANEL_DRAG_HANDLE_WIDTH,
                  opacity: !show1040 ? 0 : 1,
                  pointerEvents: !show1040 ? 'none' : 'auto',
                  transition: panelResizing ? 'none' : undefined,
                }}
              >
                <DotsSix size="small" className={dragStyles.handleIcon} aria-hidden />
              </div>
            )}

            {/* Unified right rail — one shell; inner content switches by rightPanelMode */}
            {!hideRightRailForPopout && (
            <div
              className={`${styles.rightPanel} ${diagnosticsSourceSplit ? styles.splitRail : ''} ${rightPanelAnimating ? styles.rightPanelEntering : ''} ${rightPanelExiting ? styles.rightPanelExiting : ''} ${rightPanelFills ? styles.rightPanelFills : ''}`}
              ref={rightRef}
              style={{
                width: shellHidden ? 0 : (rightPanelFills ? undefined : activePanelWidth),
                flex: (rightPanelFills && rightPanelOpen) ? '1 1 0%' : '0 0 auto',
                flexDirection: diagnosticsSourceSplit ? 'row' : 'column',
                minWidth: 0,
                overflow: 'hidden',
                opacity: shellHidden ? 0 : 1,
                transition: panelResizing ? 'none' : undefined,
              }}
            >
              {(rightPanelMode === 'sources' || diagnosticsSourceSplit) && !poppedOut && (
              <div
                className={
                  diagnosticsSourceSplit ? styles.splitSourcesColumn : styles.sourcesColumn
                }
                style={
                  diagnosticsSourceSplit
                    ? { borderRight: '1px solid #D5DEE3' }
                    : undefined
                }
              >
              <>
              {/* Source panel header — title left; Close on right */}
              <div className={styles.sourcePanelHeader}>
                {/* "Back to agent insights" — hidden when AI panel is already visible beside sources */}
                {!inImportPhase && fromAgent && !diagnosticsSourceSplit ? (
                  <button
                    className={styles.agentBackBtn}
                    onClick={() => { setFromAgent(false); setActiveIssueField(null); handleAgentOpen(agentSubView) }}
                  >
                    <ChevronLeft size="small" /> Back to agent insights
                  </button>
                ) : (
                  <div className={styles.sourcePanelTitleGroup}>
                    <span className={styles.sourcePanelTitle}>
                      Source documents
                    </span>
                    {isReviewerConfirmMode && (
                      <span className={styles.sourcePanelLayerBadge}>
                        Reviewer confirm mode · Preparer attestation shown
                      </span>
                    )}
                  </div>
                )}
                <div className={styles.sourcePanelActions}>
                  <IconControl
                    label="Detach"
                    labelAlignment="right"
                    size="small"
                    aria-label="Detach source documents to new window"
                    onClick={handlePopOutSourcePanel}
                  >
                    <PopOut size="small" />
                  </IconControl>
                  <IconControl
                    size="small"
                    aria-label="Hide source documents"
                    onClick={handleCloseSourcePanel}
                  >
                    <ChevronRight size="small" />
                  </IconControl>
                </div>
              </div>
              {showPreparerImportPhase && SHOW_IMPORT_FLAGS && unreviewedDocCount === 0 && phase1Remaining > 0 && (
                <Phase1IssueBanner
                  mode="flags"
                  unresolvedCount={phase1Remaining}
                  onVerify={handleVerifyNext}
                />
              )}
              <ReviewTab
                activeTopTab={activeTopTab}
                verifiedDocs={verifiedDocs}
                tabVerifiedKeys={tabVerifiedKeys}
                tabReviewCounts={showPreparerImportPhase ? tabReviewCounts : undefined}
                unreviewedCounts={showPreparerImportPhase ? tabUnreviewedCounts : undefined}
                typeReviewed={showPreparerImportPhase ? typeReviewed : undefined}
                tabConfirmStatus={reviewRole === 'reviewer' ? tabConfirmStatus : undefined}
                tabConfirmCounts={reviewRole === 'reviewer' ? tabConfirmCounts : undefined}
                showAddItem={showPreparerImportPhase}
                onAddItemClick={handleAddItemClick}
                showNextDocument={showPreparerImportPhase}
                onNextDocumentClick={handleReviewNextDocument}
                unreviewedDocCount={unreviewedDocCount}
                onTopTabChange={(tab) => {
                  setActiveTopTab(tab)
                  setFromAgent(false)
                  setSelectedField(null)
                  setActiveIssueField(null)
                  if (tab === 'questionnaire') setAddItemReviewMode(false)
                }}
              />

              {addItemReviewMode ? (
                <AddItemReviewPane
                  activeTopTab={activeTopTab}
                  usedLibraryIds={usedLibraryIds}
                  onLink={handleAddItemLink}
                  onCancel={() => setAddItemReviewMode(false)}
                />
              ) : (
              <>
              {/* Peel tabs — payer switcher for multi-payer doc types */}
              {activeTopTab === '1099-divs' && (
                <PeelTab
                  tabs={DIV_PAYER_TABS.map(t => ({
                    ...t,
                    needsReview: !isDocShownVerified(verifiedDocs, divVerifiedDocKey(t.key), reviewerConfirmedDocs),
                    flagCount: importFlagCountForDisplay(divPayerFieldCounts[t.key]),
                    showClearedCheck: isDocShownVerified(verifiedDocs, divVerifiedDocKey(t.key), reviewerConfirmedDocs),
                    confirmStatus: peelDocConfirmStatus(divVerifiedDocKey(t.key)),
                  }))}
                  activeKey={activeDivPayer}
                  onChange={key => setActiveDivPayer(key as DivPayer)}
                />
              )}
              {activeTopTab === '1099-ints' && (
                <PeelTab
                  tabs={INT_PAYER_TABS.map(t => ({
                    ...t,
                    needsReview: !isDocShownVerified(verifiedDocs, intVerifiedDocKey(t.key), reviewerConfirmedDocs),
                    flagCount: importFlagCountForDisplay(intPayerFieldCounts[t.key]),
                    showClearedCheck: isDocShownVerified(verifiedDocs, intVerifiedDocKey(t.key), reviewerConfirmedDocs),
                    confirmStatus: peelDocConfirmStatus(intVerifiedDocKey(t.key)),
                  }))}
                  activeKey={activeIntPayer}
                  onChange={key => setActiveIntPayer(key as IntPayer)}
                />
              )}
              {activeTopTab === 'w2s' && (
                <PeelTab
                  tabs={W2_PAYER_TABS.map(t => ({
                    ...t,
                    needsReview: !isDocShownVerified(verifiedDocs, t.key, reviewerConfirmedDocs),
                    flagCount: importFlagCountForDisplay(w2PayerFieldCounts[t.key]),
                    showClearedCheck: isDocShownVerified(verifiedDocs, t.key, reviewerConfirmedDocs),
                    confirmStatus: peelDocConfirmStatus(t.key),
                  }))}
                  activeKey={activeSubTab}
                  onChange={key => setActiveSubTab(key as W2Employer)}
                />
              )}
              {activeTopTab === '1099-rs' && (
                <PeelTab
                  tabs={R_PAYER_TABS.map(t => ({
                    ...t,
                    needsReview: !isDocShownVerified(verifiedDocs, '1099-r', reviewerConfirmedDocs),
                    flagCount: importFlagCountForDisplay(countPhase1FlagsForRPayer(reviewedFields)),
                    showClearedCheck: isDocShownVerified(verifiedDocs, '1099-r', reviewerConfirmedDocs),
                    confirmStatus: peelDocConfirmStatus('1099-r'),
                  }))}
                  activeKey="meridian"
                  onChange={() => {}}
                />
              )}
              {activeTopTab === '1099-necs' && (
                <PeelTab
                  tabs={NEC_PAYER_TABS.map(t => ({
                    ...t,
                    needsReview: !isDocShownVerified(verifiedDocs, '1099-nec', reviewerConfirmedDocs),
                    flagCount: importFlagCountForDisplay(countPhase1FlagsForNecPayer(t.key, reviewedFields)),
                    showClearedCheck: isDocShownVerified(verifiedDocs, '1099-nec', reviewerConfirmedDocs),
                    confirmStatus: peelDocConfirmStatus('1099-nec'),
                  }))}
                  activeKey="summit"
                  onChange={() => {}}
                />
              )}

              {activeTopTab !== 'questionnaire' && activeVerifyDocKey && (
                <div className={styles.importSourceRow}>
                  <ImportSourceBadge docKey={activeVerifyDocKey} />
                </div>
              )}

              {/* Document preview + detail fields. flex-basis % (not width/height alone)
                  so the six-dot handle can shrink the preview even when the document
                  image has a large intrinsic min-size. */}
              <div
                ref={splitPaneRef}
                style={{
                  display: 'flex',
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  overflow: 'hidden',
                  flexDirection: previewSideBySide ? 'row' : 'column',
                }}
              >
              {activeTopTab !== 'questionnaire' && (
              <>
              <div style={previewSideBySide
                ? {
                    flex: `0 0 ${previewHeight}%`,
                    overflow: 'hidden',
                    borderRight: '1px solid #D5DEE3',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    minWidth: 0,
                  }
                : {
                    flex: `0 0 ${previewHeight}%`,
                    overflow: 'hidden',
                    borderBottom: '1px solid #D5DEE3',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    minWidth: 0,
                  }
              }>
                <DocumentPreview
                  imageSrc={sourceDocPreview.imageSrc}
                  alt={sourceDocPreview.alt}
                  customContent={
                    sourceDocPreview.useInt1099UnwaveringHtml
                      ? <Int1099FormPreview />
                      : undefined
                  }
                />
              </div>

              {/* Drag handle — vertical (col-resize) side by side, horizontal (row-resize) stacked */}
              <div
                className={previewSideBySide ? dragStyles.handleVertical : dragStyles.handleHorizontal}
                onPointerDown={handlePreviewDrag}
                role="separator"
                aria-orientation={previewSideBySide ? 'vertical' : 'horizontal'}
                aria-label="Resize document preview and Details"
              >
                <DotsSix size="small" className={`${dragStyles.handleIcon} ${previewSideBySide ? '' : dragStyles.rotated90}`} />
              </div>
              </>
              )}

              {/* Detail fields — switches based on active tab */}
              <div className={styles.detailsPane}>
              {activeTopTab === 'w2s' && (
                <DetailFields
                  formTitle="Details: Wages, Salaries, Tips (W-2)"
                  importReadOnly={isReviewerConfirmMode}
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  activeSubTab={activeSubTab}
                  onSubTabChange={(tab) => setActiveSubTab(tab as W2Employer)}
                  wages={{ bingEquipment: 0, techCircle: wages.techCircle }}
                  onWageChange={(employer, value) => {
                    setWages({ ...wages, [employer]: value })
                    markEdited(`wages-${employer}`)
                  }}
                  fieldValues={{ ...fieldValues, withholding: fieldValues.withholding[activeSubTab] }}
                  onFieldValueChange={(key, value) => {
                    if (key === 'withholding' && typeof value === 'number') {
                      updateField('withholding', { techCircle: value })
                      markEdited('withholding')
                    } else {
                      updateField(key as keyof typeof fieldValues, value as number)
                      markEdited(String(key))
                    }
                  }}
                  box12Rows={amounts.box12Rows}
                  onBox12RowChange={(sub, patch) => {
                    updateAmounts({
                      box12Rows: {
                        ...amounts.box12Rows,
                        [sub]: { ...amounts.box12Rows[sub], ...patch },
                      },
                    })
                    markEdited(`box12${sub}-${activeSubTab}`)
                  }}
                  onIdentityChange={(kind, value) => {
                    if (kind === 'ssn') updateAmounts({ employeeSsn: value })
                    else updateAmounts({ employerEin: value })
                    markEdited(kind === 'ssn' ? 'ssn-techCircle' : 'ein-techCircle')
                  }}
                  identityValues={{ ssn: amounts.employeeSsn, ein: amounts.employerEin }}
                  box13={{
                    retirementPlan: amounts.box13RetirementPlan,
                    statutoryEmployee: amounts.box13StatutoryEmployee,
                    thirdPartySickPay: amounts.box13ThirdPartySickPay,
                  }}
                  onBox13Change={patch => {
                    updateAmounts({
                      ...(patch.retirementPlan !== undefined
                        ? { box13RetirementPlan: patch.retirementPlan }
                        : {}),
                      ...(patch.statutoryEmployee !== undefined
                        ? { box13StatutoryEmployee: patch.statutoryEmployee }
                        : {}),
                      ...(patch.thirdPartySickPay !== undefined
                        ? { box13ThirdPartySickPay: patch.thirdPartySickPay }
                        : {}),
                    })
                    markEdited('box13')
                  }}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  editedFieldsMeta={editedFieldsMeta}
                  fieldOverrides={fieldOverrides}
                  onFieldOverride={setFieldOverride}
                  verifiedDocs={verifiedDocs}
                  verifiedDocsMeta={verifiedDocsMeta}
                  reviewerConfirmedDocs={reviewerConfirmedDocs}
                  reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                  onVerifyDoc={toggleVerifiedDoc}
                  flaggedFields={importFlagsForDisplay(mergeInputFlags({
                    ssn: PHASE1_FLAG_MESSAGES.w2.ssn,
                    wages: PHASE1_FLAG_MESSAGES.w2.wages,
                    box12: PHASE1_FLAG_MESSAGES.w2.box12,
                    ein: PHASE1_FLAG_MESSAGES.w2.ein,
                  }, yoyInputFlags))}
                />
              )}
              {activeTopTab === '1099-divs' && (
                <DetailFieldsDiv
                  importReadOnly={isReviewerConfirmMode}
                  activePayer={activeDivPayer}
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  fieldValues={{ ...fieldValues, withholding: totalWithholding, divWithholding: amounts.divWithholding }}
                  onFieldValueChange={(key, value) => {
                    updateField(key as keyof typeof fieldValues, value)
                    markEdited(String(key))
                  }}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  amounts={amounts}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  fieldOverrides={fieldOverrides}
                  onFieldOverride={setFieldOverride}
                  verifiedDocs={verifiedDocs}
                  verifiedDocsMeta={verifiedDocsMeta}
                  onVerifyDoc={toggleVerifiedDoc}
                  reviewerConfirmedDocs={reviewerConfirmedDocs}
                  reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                  flaggedFields={importFlagsForDisplay(mergeInputFlags({
                    divCollectibles: PHASE1_FLAG_MESSAGES.div.divCollectibles,
                    divNonDiv: PHASE1_FLAG_MESSAGES.div.divNonDiv,
                    fedTaxWithheld: PHASE1_FLAG_MESSAGES.div.fedTaxWithheld,
                    ordinaryDivs: PHASE1_FLAG_MESSAGES.div.ordinaryDivs,
                  }, yoyInputFlags))}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === '1099-ints' && (
                <DetailFields1099
                  importReadOnly={isReviewerConfirmMode}
                  activePayer={activeIntPayer}
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  fieldValues={{ ...fieldValues, withholding: totalWithholding }}
                  onFieldValueChange={(key, value) => {
                    updateField(key as keyof typeof fieldValues, value)
                    markEdited(String(key))
                  }}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  amounts={amounts}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  editedFieldsMeta={editedFieldsMeta}
                  fieldOverrides={fieldOverrides}
                  onFieldOverride={setFieldOverride}
                  verifiedDocs={verifiedDocs}
                  verifiedDocsMeta={verifiedDocsMeta}
                  onVerifyDoc={toggleVerifiedDoc}
                  reviewerConfirmedDocs={reviewerConfirmedDocs}
                  reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                  flaggedFields={importFlagsForDisplay(mergeInputFlags({
                    taxableInterest: PHASE1_FLAG_MESSAGES.int.taxableInterest,
                  }, yoyInputFlags))}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === '1099-rs' && (
                <DetailFields1099R
                  importReadOnly={isReviewerConfirmMode}
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  amounts={amounts}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  fieldOverrides={fieldOverrides}
                  onFieldOverride={setFieldOverride}
                  verifiedDocs={verifiedDocs}
                  verifiedDocsMeta={verifiedDocsMeta}
                  onVerifyDoc={toggleVerifiedDoc}
                  reviewerConfirmedDocs={reviewerConfirmedDocs}
                  reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                  flaggedFields={importFlagsForDisplay(mergeInputFlags({
                    grossDistrib: PHASE1_FLAG_MESSAGES.r.grossDistrib,
                  }, yoyInputFlags))}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === '1099-necs' && (
                <DetailFieldsNec
                  importReadOnly={isReviewerConfirmMode}
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  amounts={amounts}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  fieldOverrides={fieldOverrides}
                  onFieldOverride={setFieldOverride}
                  verifiedDocs={verifiedDocs}
                  verifiedDocsMeta={verifiedDocsMeta}
                  onVerifyDoc={toggleVerifiedDoc}
                  reviewerConfirmedDocs={reviewerConfirmedDocs}
                  reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                  flaggedFields={importFlagsForDisplay(mergeInputFlags({
                    'nec-box1': PHASE1_FLAG_MESSAGES.nec.necBox1,
                  }, yoyInputFlags))}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                  onOpenScheduleC={handleOpenScheduleC}
                />
              )}
              {activeTopTab === 'questionnaire' && (
                <QuestionnaireResponsesPanel
                  verifiedDocs={verifiedDocs}
                  verifiedDocsMeta={verifiedDocsMeta}
                  onVerifyDoc={toggleVerifiedDoc}
                  reviewerConfirmedDocs={reviewerConfirmedDocs}
                  reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                  highlightResponseId={questionnaireHighlightId}
                  onNavigateToField={handleQuestionnaireNavigateToField}
                />
              )}
              </div>
              </div>
              </>
              )}

              </>
              </div>
              )}

              {diagnosticsSourceSplit && !poppedOut && (
                <div
                  className={`${dragStyles.handleVertical} ${styles.summarySplitter}`}
                  onPointerDown={handleAgentDrag}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize source documents and AI diagnostics"
                  style={{
                    width: PANEL_DRAG_HANDLE_WIDTH,
                    flexShrink: 0,
                    transition: panelResizing ? 'none' : undefined,
                  }}
                >
                  <DotsSix size="small" className={dragStyles.handleIcon} aria-hidden />
                </div>
              )}

              {(rightPanelMode === 'ai' || diagnosticsSourceSplit) && (
              <div
                className={`${styles.agentColumn} ${diagnosticsSourceSplit ? styles.agentColumnSplit : ''}`}
                style={diagnosticsSourceSplit ? { width: agentPanelWidth } : undefined}
              >
                <AgentLoadingPane
                  onClose={handleAgentClose}
                  isLoading={agentView === 'loading'}
                  showReport={agentView === 'report' || agentView === 'closing'}
                  closing={agentView === 'closing'}
                  reportContent={
                    <AgentReportPane
                      embedded
                      closing={agentView === 'closing'}
                      onClose={handleAgentClose}
                      onSignOff={handleWrapUpPass}
                      onYoyToggle={setYoyExpanded}
                      onMarkReviewed={handlePhase2MarkReviewed}
                      reviewedFields={reviewedFields}
                      initialSubView={agentSubView}
                      onSubViewChange={(subView) => {
                        setAgentSubView(subView)
                        // Auto-select the issue field when detail pane opens
                        if (subView === 'yoyDetail') {
                          setSelectedField('wages')
                        } else {
                          setSelectedField(null)
                        }
                      }}
                      onViewW2={(fromSubView) => {
                        if (fromSubView) setAgentSubView(fromSubView)
                        setActiveIssueField('wages')
                        setSelectedField('wages')
                        setActiveTopTab('w2s')
                        openDiagnosticsSourceSplit()
                      }}
                      onNavigateToTab={(tab, subTab, field, questionnaireResponseId, focus) => {
                        // Summary-only CTAs (e.g. NIIT “Summary — investment lines”):
                        // switch to Summary, highlight the CY line, scroll it into view —
                        // do not open Sources on a stale tab.
                        if (!tab && field) {
                          setSelectedField(field)
                          setActiveIssueField(field)
                          setQuestionnaireHighlightId(null)
                          setOutputFormId('summary')
                          setShow1040(true)
                          const rowKey = get1040HighlightField(field) ?? field
                          requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                              const row = document.querySelector(
                                `[data-field-row="${rowKey}"]`,
                              ) as HTMLElement | null
                              row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                            })
                          })
                          return
                        }
                        if (tab) {
                          setActiveTopTab(tab)
                          if (subTab) setActiveSubTab(subTab)
                        }
                        // Prefer field-driven payer navigation (DIV / INT peel tabs)
                        if (field) {
                          const nav = navigationForDetailField(field)
                          if (nav?.divPayer) setActiveDivPayer(nav.divPayer)
                          if (nav?.intPayer) setActiveIntPayer(nav.intPayer)
                          if (nav?.tab && !tab) setActiveTopTab(nav.tab)
                        }
                        if (tab === 'questionnaire') {
                          setQuestionnaireHighlightId(questionnaireResponseId ?? null)
                          setSelectedField(null)
                          setActiveIssueField(null)
                        } else if (focus === 'preview') {
                          // Review source: open document preview; light/no Details highlight
                          setSelectedField(null)
                          setActiveIssueField(null)
                          setQuestionnaireHighlightId(null)
                          setPreviewHeight(58)
                        } else if (field) {
                          // Go to mismatch / input: highlight field; favor source preview in split layout
                          setSelectedField(field)
                          setActiveIssueField(field)
                          setQuestionnaireHighlightId(null)
                          setPreviewHeight(focus === 'preview' ? 58 : 50)
                        } else if (!tab) {
                          setSelectedField(null)
                          setActiveIssueField(null)
                        }
                        openDiagnosticsSourceSplit()
                      }}
                      onHighlightField={(field, issueKey) => {
                        setSelectedField(field)
                        setActiveIssueField(field)
                        setActiveDiagnosticKey(issueKey ?? null)
                      }}
                      onDiagnosticFocus={(issueKey) => {
                        setActiveDiagnosticKey(issueKey)
                        if (!issueKey) {
                          setActiveIssueField(null)
                        }
                      }}
                      fieldValues={{ ...fieldValues, withholding: totalWithholding }}
                      liveTotals={liveTotals}
                      amounts={amounts}
                      onOpenForm={(label) => {
                        const formId = resolveOutputFormFromAction(label)
                        if (formId) {
                          setOutputFormId(formId)
                          setShow1040(true)
                        }
                      }}
                      onFieldValueChange={(key, value) => {
                        if (key === 'withholding' && typeof value === 'number') {
                          updateField('withholding', { techCircle: value })
                        } else {
                          updateField(key as keyof typeof fieldValues, value as number)
                        }
                      }}
                    />
                  }
                />
              </div>
              )}

              {rightPanelMode === 'comments' && (
                <NotesPane
                  notes={notes}
                  onAdd={(text) => handleAddNote(text)}
                  onEdit={handleEditNote}
                  onResolve={handleResolveNote}
                  onReply={handleReplyNote}
                  focusNoteId={focusNoteId}
                  onClose={handleCloseNotes}
                  closing={panelClosing}
                />
              )}

              {rightPanelMode === 'summary' && handoffSnapshot && (
                <HandoffSummary
                  variant="drawer"
                  snapshot={handoffSnapshot}
                  checklist={reviewChecklist}
                  milestoneState={milestoneState}
                  singlePersonMode={singlePersonMode}
                  showChecklist={showChecklist}
                  onToggleChecklistItem={setMilestoneDeclaration}
                  signOffReady={signOffReady}
                  signOffBlockerText={signOffBlockerMessage}
                  outstandingOpenCount={outstandingOpenCount}
                  manualChecklistItems={manualChecklistItems}
                  reviewPass={reviewPass}
                  isPreparer={reviewRole === 'preparer'}
                  amounts={amounts}
                  briefEnterAnim={summaryBriefEnterAnim}
                  closing={panelClosing}
                  onClose={handleCloseSummaryPanel}
                  onContinue={handleCloseSummaryPanel}
                  onJump={handleHandoffJump}
                  onFinishAndFile={handlePreviewFinishAndFile}
                  onPassToReviewer={handleConfirmHandoffSend}
                  onOpenAsReviewer={
                    summaryMode === 'awaiting-reviewer'
                      ? handleSwitchToReviewerRole
                      : handleBeginPass2Review
                  }
                />
              )}
            </div>
            )}
      </div>
    </div>
  )
}
