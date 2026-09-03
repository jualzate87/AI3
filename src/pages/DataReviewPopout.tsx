import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronRight, Close, DotsSix } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import ReviewTab from './data-review/ReviewTab'
import type { TopTab } from './data-review/ReviewTab'
import ImportSourceBadge from '../components/ImportSourceBadge/ImportSourceBadge'
import Phase1IssueBanner from './data-review/Phase1IssueBanner'
import {
  countPhase1Remaining,
  countPhase1FlagsForDivPayer,
  countPhase1FlagsForIntPayer,
  countPhase1FlagsForNecPayer,
  countPhase1FlagsForRPayer,
  countPhase1FlagsForW2Payer,
  getTabFlagCounts,
  getTabInitialFlagCounts,
  getNextVerifyItem,
  navigationForDetailField,
} from './data-review/phase1FieldSync'
import DocumentPreview from './data-review/DocumentPreview'
import Int1099FormPreview from './data-review/Int1099FormPreview'
import { getSourceDocPreview } from './data-review/sourceDocImages'
import { readManualDocAttachments } from '../lib/manualDocAttachments'
import DetailFields, { W2_PAYER_TABS } from './data-review/DetailFields'
import type { W2Employer } from './data-review/DetailFields'
import DetailFields1099, { INT_PAYER_TABS, intVerifiedDocKey } from './data-review/DetailFields1099'
import type { IntPayer } from './data-review/DetailFields1099'
import DetailFieldsDiv, { DIV_PAYER_TABS, divVerifiedDocKey } from './data-review/DetailFieldsDiv'
import type { DivPayer } from './data-review/DetailFieldsDiv'
import {
  buildTabVerifiedKeys,
  buildTabReviewCounts,
  buildTabUnreviewedCounts,
  buildTypeReviewed,
  buildTabConfirmCounts,
  buildTabConfirmStatus,
  countVerifiedPacketDocs,
  getDocConfirmStatus,
} from './data-review/docReviewStatus'
import DetailFields1099R, { R_PAYER_TABS } from './data-review/DetailFields1099R'
import DetailFieldsNec, { NEC_PAYER_TABS } from './data-review/DetailFieldsNec'
import PeelTab from './data-review/PeelTab'
import QuestionnaireResponsesPanel from './data-review/QuestionnaireResponsesPanel'
import DocReviewProgress from './data-review/DocReviewProgress'
import UnsavedChangesModal from './data-review/UnsavedChangesModal'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import { usePacketDocReviewControls } from '../hooks/usePacketDocReviewControls'
import { computeLiveReturn } from '../data/liveReturn'
import { PHASE1_FLAG_MESSAGES } from './data-review/phase1FlagMessages'
import {
  importFlagCountForDisplay,
  importFlagsForDisplay,
  SHOW_IMPORT_FLAGS,
} from '../lib/prototypeFeatureFlags'
import img1040PriorPage1 from '../assets/jessica-1040-2024-variant-1.png'
import img1040PriorPage2 from '../assets/jessica-1040-2024-variant-2.png'
import { isDocShownVerified } from '../data/verifiedDocKeys'
import { resolveActiveVerifyDocKey } from '../data/documentImportMeta'
import { getStoredDemoRole, SOURCE_DOC_POPOUT_NAV_CHANNEL, type SourceDocumentPopoutContext } from '../lib/prototypeRoutes'
import dragStyles from '../styles/data-review/DragHandle.module.css'
import styles from '../styles/data-review/DataReviewPopout.module.css'

// ProtoC: the pop-out is the same view as the main window's right panel, not a
// separate copy — same flags, same reviewed state, same edits, same document
// preview zoom/pan, all live-synced via useSyncedReviewState (BroadcastChannel).
// See DataReviewPage.tsx's right panel for the layout this mirrors.

const POPOUT_TOP_TABS = new Set<string>([
  'w2s',
  '1099-divs',
  '1099-ints',
  '1099-rs',
  '1099-necs',
  'questionnaire',
])

function applyPopoutContext(
  context: SourceDocumentPopoutContext,
  handlers: {
    setActiveTopTab: (tab: TopTab) => void
    setActiveSubTab: (subTab: W2Employer) => void
    setActiveDivPayer: (payer: DivPayer) => void
    setActiveIntPayer: (payer: IntPayer) => void
    setSelectedField: (field: string | null) => void
  },
): void {
  const { tab, subTab, divPayer, intPayer, field } = context
  if (tab && POPOUT_TOP_TABS.has(tab)) {
    handlers.setActiveTopTab(tab as TopTab)
  }
  if (subTab === 'techCircle' || subTab === 'bingEquipment') {
    handlers.setActiveSubTab(subTab)
  }
  if (divPayer === 'beacon' || divPayer === 'northmark' || divPayer === 'token') {
    handlers.setActiveDivPayer(divPayer)
  }
  if (
    intPayer === 'harborline'
    || intPayer === 'cascade'
    || intPayer === 'unwavering'
  ) {
    handlers.setActiveIntPayer(intPayer)
  }
  if (field) {
    handlers.setSelectedField(field)
  }
}

function contextFromSearchParams(params: URLSearchParams): SourceDocumentPopoutContext {
  const context: SourceDocumentPopoutContext = {}
  const tab = params.get('tab')
  if (tab) context.tab = tab
  const subTab = params.get('subTab')
  if (subTab) context.subTab = subTab
  const divPayer = params.get('divPayer')
  if (divPayer) context.divPayer = divPayer
  const intPayer = params.get('intPayer')
  if (intPayer) context.intPayer = intPayer
  const field = params.get('field')
  if (field) context.field = field
  return context
}

export default function DataReviewPopout() {
  const [searchParams] = useSearchParams()
  const [sessionDirty, setSessionDirty] = useState(false)
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false)
  const [recalculatedFields, setRecalculatedFields] = useState<Set<string>>(new Set())

  const reviewRole = getStoredDemoRole() ?? 'preparer'
  const isReviewerConfirmMode = reviewRole === 'reviewer'

  const {
    activeTopTab, setActiveTopTab,
    activeSubTab, setActiveSubTab,
    selectedField, setSelectedField,
    wages, setWages,
    amounts, updateAmounts,
    fieldValues, updateFieldValue,
    reviewedFields,
    editedFieldsMeta,
    unsavedFields,
    markUnsaved,
    commitUnsavedEdits,
    fieldOverrides,
    setFieldOverride,
    activeDivPayer, setActiveDivPayer,
    activeIntPayer, setActiveIntPayer,
    markReviewed: handleMarkReviewed,
    markReviewedBulk: handleMarkReviewedBulk,
    verifiedDocs,
    verifiedDocsMeta,
    reviewerConfirmedDocs,
    reviewerConfirmedDocsMeta,
    toggleVerifiedDoc,
    getSyncedSnapshot,
    restoreSyncedSnapshot,
  } = useSyncedReviewState()

  const baselineRef = useRef<ReturnType<typeof getSyncedSnapshot> | null>(null)

  const touchDirty = useCallback(() => setSessionDirty(true), [])

  const markFieldEdited = useCallback((fieldKey: string) => {
    markUnsaved(fieldKey)
    touchDirty()
  }, [markUnsaved, touchDirty])

  const flashRecalculatedFields = useCallback((keys: string[]) => {
    if (!keys.length) return
    setRecalculatedFields(new Set(keys))
    window.setTimeout(() => setRecalculatedFields(new Set()), 3500)
  }, [])

  const handleFieldOverride = useCallback((fieldKey: string, value: string) => {
    setFieldOverride(fieldKey, value)
    touchDirty()
  }, [setFieldOverride, touchDirty])

  const applyPopoutNavigation = useCallback((context: SourceDocumentPopoutContext) => {
    applyPopoutContext(context, {
      setActiveTopTab,
      setActiveSubTab,
      setActiveDivPayer,
      setActiveIntPayer,
      setSelectedField,
    })
  }, [setActiveTopTab, setActiveSubTab, setActiveDivPayer, setActiveIntPayer, setSelectedField])

  useEffect(() => {
    applyPopoutNavigation(contextFromSearchParams(searchParams))
  }, [searchParams, applyPopoutNavigation])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '')
      const q = hash.indexOf('?')
      if (q === -1) return
      applyPopoutNavigation(contextFromSearchParams(new URLSearchParams(hash.slice(q + 1))))
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'source-doc-popout-nav') return
      applyPopoutNavigation(event.data.context ?? {})
    }

    const navChannel = new BroadcastChannel(SOURCE_DOC_POPOUT_NAV_CHANNEL)
    navChannel.onmessage = (event: MessageEvent<SourceDocumentPopoutContext>) => {
      applyPopoutNavigation(event.data ?? {})
    }

    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('message', onMessage)
      navChannel.close()
    }
  }, [applyPopoutNavigation])

  useEffect(() => {
    if (!baselineRef.current) {
      baselineRef.current = getSyncedSnapshot()
    }
  }, [getSyncedSnapshot])

  const requestClose = useCallback(() => {
    if (sessionDirty) {
      setUnsavedModalOpen(true)
      return
    }
    window.close()
  }, [sessionDirty])

  const handleStayEditing = useCallback(() => {
    setUnsavedModalOpen(false)
  }, [])

  const handleLeaveWithoutSaving = useCallback(() => {
    if (baselineRef.current) {
      restoreSyncedSnapshot(baselineRef.current)
    }
    setSessionDirty(false)
    setUnsavedModalOpen(false)
    window.close()
  }, [restoreSyncedSnapshot])

  const handleSaveAndRecalculate = useCallback(() => {
    const committed = commitUnsavedEdits()
    flashRecalculatedFields(committed)
    baselineRef.current = getSyncedSnapshot()
    setSessionDirty(false)
    setUnsavedModalOpen(false)
  }, [commitUnsavedEdits, flashRecalculatedFields, getSyncedSnapshot])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!sessionDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [sessionDirty])

  const liveTotals = computeLiveReturn(amounts)
  const totalWithholding = liveTotals.totalWithholding
  const updateField = (key: keyof typeof fieldValues, value: number | { techCircle: number }) =>
    updateFieldValue(key, value)

  // Pop-out always shows the plain (blue) selection highlight — the orange
  // "agent issue" highlight only applies to the Phase 2 AI panel, which never
  // pops out.
  const highlightMode: 'orange' | 'blue' = 'blue'

  const phase1Remaining = countPhase1Remaining(reviewedFields)

  const applyVerifyNavigation = useCallback((field: string) => {
    const nav = navigationForDetailField(field)
    if (nav) {
      setActiveTopTab(nav.tab)
      if (nav.divPayer) setActiveDivPayer(nav.divPayer)
      if (nav.intPayer) setActiveIntPayer(nav.intPayer)
    }
    setSelectedField(field)
  }, [setActiveTopTab, setActiveDivPayer, setActiveIntPayer, setSelectedField])

  const handleVerifyNext = useCallback(() => {
    const next = getNextVerifyItem(reviewedFields, selectedField)
    if (!next) return
    applyVerifyNavigation(next.field)
  }, [reviewedFields, selectedField, applyVerifyNavigation])

  // Derived review status for tab badges and peel tabs.
  const tabFlagCounts = getTabFlagCounts(reviewedFields)
  const tabInitialFlagCounts = getTabInitialFlagCounts()
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
  const typeReviewed = buildTypeReviewed({
    verifiedDocs,
    reviewerConfirmedDocs,
    w2Counts: w2PayerFieldCounts,
    divCounts: divPayerFieldCounts,
    intCounts: intPayerFieldCounts,
    rRemaining: tabFlagCounts['1099-rs'] ?? 0,
  })
  const {
    unreviewedDocCount,
    handleTopTabChange,
    handlePeelDocChange,
    handleReviewNextDocument,
    handleVerifyDoc,
  } = usePacketDocReviewControls({
    reviewedFields,
    verifiedDocs,
    activeTopTab,
    activeSubTab,
    activeDivPayer,
    activeIntPayer,
    setActiveTopTab,
    setActiveSubTab,
    setActiveDivPayer,
    setActiveIntPayer,
    setSelectedField,
    toggleVerifiedDoc,
    onAfterMutation: touchDirty,
  })
  const { verified: verifiedDocCount, total: totalDocCount } = countVerifiedPacketDocs({
    verifiedDocs,
    reviewerConfirmedDocs,
  })
  const flagsCleared = phase1Remaining === 0
  const showPreparerImportPhase = reviewRole === 'preparer'
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
  const tabReviewCounts = buildTabReviewCounts({
    verifiedDocs,
    reviewerConfirmedDocs,
    tabVerifiedKeys,
  })
  const peelDocConfirmStatus = (docKey: string) => {
    if (reviewRole !== 'reviewer') return undefined
    const status = getDocConfirmStatus(verifiedDocs, docKey, reviewerConfirmedDocs)
    if (status === 'unverified') return undefined
    return status
  }
  const activeVerifyDocKey = resolveActiveVerifyDocKey({
    activeTopTab,
    activeSubTab,
    activeDivPayer,
    activeIntPayer,
  })
  const phase1FullyComplete = unreviewedDocCount === 0

  const rightRef = useRef<HTMLDivElement>(null)
  const [previewWidth, setPreviewWidth] = useState(40)

  // Lock document scroll chain so 100vh/dvh fits the popout window — #root defaults
  // to min-height:100vh and can grow with content, which scrolls the page and clips the top.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      rootHeight: root?.style.height ?? '',
      rootMinHeight: root?.style.minHeight ?? '',
      rootOverflow: root?.style.overflow ?? '',
    }
    html.style.overflow = 'hidden'
    html.style.height = '100%'
    body.style.overflow = 'hidden'
    body.style.height = '100%'
    if (root) {
      root.style.height = '100%'
      root.style.minHeight = '0'
      root.style.overflow = 'hidden'
    }
    return () => {
      html.style.overflow = prev.htmlOverflow
      html.style.height = prev.htmlHeight
      body.style.overflow = prev.bodyOverflow
      body.style.height = prev.bodyHeight
      if (root) {
        root.style.height = prev.rootHeight
        root.style.minHeight = prev.rootMinHeight
        root.style.overflow = prev.rootOverflow
      }
    }
  }, [])

  const handlePreviewDrag = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const right = rightRef.current
    if (!right) return
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture?.(e.pointerId)
    const startX = e.clientX
    const startWidth = previewWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX
      const rightWidth = right.getBoundingClientRect().width
      if (rightWidth <= 0) return
      setPreviewWidth(Math.max(20, Math.min(75, startWidth + (delta / rightWidth) * 100)))
    }
    const onPointerUp = (upEvent: PointerEvent) => {
      try { target.releasePointerCapture?.(upEvent.pointerId) } catch { /* already released */ }
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
  }, [previewWidth])

  const manualAttachments = readManualDocAttachments()

  const sourceDocPreview = getSourceDocPreview({
    activeTopTab,
    activeSubTab,
    activeIntPayer,
    activeDivPayer,
    prior1040Images: [img1040PriorPage1, img1040PriorPage2],
    manualAttachments,
  })

  return (
    <div className={styles.page}>
      <header className={styles.titleBar}>
        <h1 className={styles.titleBarHeading}>Source document review</h1>
        <IconControl
          aria-label="Close source document review"
          size="medium"
          shape="square"
          onClick={requestClose}
        >
          <Close />
        </IconControl>
      </header>

      <div className={styles.walkNav}>
        <DocReviewProgress
          variant="compact"
          className={styles.walkProgress}
          verified={verifiedDocCount}
          total={totalDocCount}
        />
        {showPreparerImportPhase && unreviewedDocCount > 0 && (
          <Button
            priority="primary"
            size="small"
            onClick={handleReviewNextDocument}
          >
            Next document
            <ChevronRight size="small" />
          </Button>
        )}
      </div>

      <div className={styles.bodyArea}>
      <div className={styles.headerStack}>
        <ReviewTab
          activeTopTab={activeTopTab}
          unreviewedCounts={showPreparerImportPhase ? tabUnreviewedCounts : undefined}
          verifiedDocs={verifiedDocs}
          tabVerifiedKeys={tabVerifiedKeys}
          tabReviewCounts={showPreparerImportPhase ? tabReviewCounts : undefined}
          typeReviewed={showPreparerImportPhase ? typeReviewed : undefined}
          tabConfirmStatus={reviewRole === 'reviewer' ? tabConfirmStatus : undefined}
          tabConfirmCounts={reviewRole === 'reviewer' ? tabConfirmCounts : undefined}
          showAddItem={false}
          showNextDocument={false}
          unreviewedDocCount={unreviewedDocCount}
          onTopTabChange={handleTopTabChange}
        />

        {showPreparerImportPhase && SHOW_IMPORT_FLAGS && unreviewedDocCount === 0 && phase1Remaining > 0 && (
          <Phase1IssueBanner
            mode="flags"
            unresolvedCount={phase1Remaining}
            onVerify={handleVerifyNext}
          />
        )}

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
          onChange={handlePeelDocChange}
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
          onChange={handlePeelDocChange}
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
          onChange={handlePeelDocChange}
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

      </div>

      {activeTopTab !== 'questionnaire' && activeVerifyDocKey && (
        <div className={styles.importSourceRow}>
          <ImportSourceBadge docKey={activeVerifyDocKey} />
        </div>
      )}

      <div ref={rightRef} className={styles.splitPane}>
          {activeTopTab !== 'questionnaire' && (
          <div className={styles.previewPane} style={{ flex: `0 0 ${previewWidth}%` }}>
            <DocumentPreview
              imageSrc={sourceDocPreview.imageSrc}
              alt={sourceDocPreview.alt}
              importDocKey={activeVerifyDocKey}
              customContent={
                sourceDocPreview.useInt1099UnwaveringHtml
                  ? <Int1099FormPreview />
                  : undefined
              }
            />
          </div>
          )}

          {activeTopTab !== 'questionnaire' && (
          <div
            className={dragStyles.handleVertical}
            onPointerDown={handlePreviewDrag}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize document preview and Details"
          >
            <DotsSix size="small" className={dragStyles.handleIcon} />
          </div>
          )}

          <div className={styles.detailsPane}>
            {activeTopTab === 'w2s' && (
              <DetailFields
                formTitle="Details: Wages, Salaries, Tips (W-2)"
                importReadOnly={isReviewerConfirmMode}
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                activeSubTab={activeSubTab}
                onSubTabChange={(tab) => setActiveSubTab(tab as W2Employer)}
                wages={{ bingEquipment: 0, techCircle: wages.techCircle }}
                onWageChange={(employer, value) => {
                  setWages({ ...wages, [employer]: value })
                  markFieldEdited(`wages-${employer}`)
                }}
                fieldValues={{ ...fieldValues, withholding: fieldValues.withholding[activeSubTab] }}
                onFieldValueChange={(key, value) => {
                  if (key === 'withholding' && typeof value === 'number') {
                    updateField('withholding', { techCircle: value })
                    markFieldEdited('withholding')
                  } else {
                    updateField(key as keyof typeof fieldValues, value as number)
                    markFieldEdited(String(key))
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
                  markFieldEdited(`box12${sub}-${activeSubTab}`)
                }}
                onIdentityChange={(kind, value) => {
                  if (kind === 'ssn') updateAmounts({ employeeSsn: value })
                  else updateAmounts({ employerEin: value })
                  markFieldEdited(kind === 'ssn' ? 'ssn-techCircle' : 'ein-techCircle')
                }}
                identityValues={{ ssn: amounts.employeeSsn, ein: amounts.employerEin }}
                box13={{
                  retirementPlan: amounts.box13RetirementPlan,
                  statutoryEmployee: amounts.box13StatutoryEmployee,
                  thirdPartySickPay: amounts.box13ThirdPartySickPay,
                }}
                onBox13Change={patch => {
                  updateAmounts({
                    ...(patch.retirementPlan !== undefined ? { box13RetirementPlan: patch.retirementPlan } : {}),
                    ...(patch.statutoryEmployee !== undefined ? { box13StatutoryEmployee: patch.statutoryEmployee } : {}),
                    ...(patch.thirdPartySickPay !== undefined ? { box13ThirdPartySickPay: patch.thirdPartySickPay } : {}),
                  })
                  markFieldEdited('box13')
                }}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                unsavedFields={unsavedFields}
                recalculatedFields={recalculatedFields}
                editedFieldsMeta={editedFieldsMeta}
                fieldOverrides={fieldOverrides}
                onFieldOverride={handleFieldOverride}
                verifiedDocs={verifiedDocs}
                verifiedDocsMeta={verifiedDocsMeta}
                reviewerConfirmedDocs={reviewerConfirmedDocs}
                reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                onVerifyDoc={handleVerifyDoc}
                flaggedFields={importFlagsForDisplay({
                  ssn: PHASE1_FLAG_MESSAGES.w2.ssn,
                  wages: PHASE1_FLAG_MESSAGES.w2.wages,
                  box12: PHASE1_FLAG_MESSAGES.w2.box12,
                  ein: PHASE1_FLAG_MESSAGES.w2.ein,
                })}
              />
            )}
            {activeTopTab === '1099-divs' && (
              <DetailFieldsDiv
                importReadOnly={isReviewerConfirmMode}
                activePayer={activeDivPayer}
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                fieldValues={{ ...fieldValues, withholding: totalWithholding, divWithholding: amounts.divWithholding }}
                onFieldValueChange={(key, value) => {
                  updateField(key as keyof typeof fieldValues, value)
                  markFieldEdited(String(key))
                }}
                onAmountChange={(patch, editedKey) => {
                  updateAmounts(patch)
                  if (editedKey) markFieldEdited(editedKey)
                  else touchDirty()
                }}
                amounts={amounts}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                unsavedFields={unsavedFields}
                recalculatedFields={recalculatedFields}
                fieldOverrides={fieldOverrides}
                onFieldOverride={handleFieldOverride}
                verifiedDocs={verifiedDocs}
                verifiedDocsMeta={verifiedDocsMeta}
                onVerifyDoc={handleVerifyDoc}
                reviewerConfirmedDocs={reviewerConfirmedDocs}
                reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                flaggedFields={importFlagsForDisplay({
                  divCollectibles: PHASE1_FLAG_MESSAGES.div.divCollectibles,
                  divNonDiv: PHASE1_FLAG_MESSAGES.div.divNonDiv,
                  fedTaxWithheld: PHASE1_FLAG_MESSAGES.div.fedTaxWithheld,
                  ordinaryDivs: PHASE1_FLAG_MESSAGES.div.ordinaryDivs,
                })}
              />
            )}
            {activeTopTab === '1099-ints' && (
              <DetailFields1099
                importReadOnly={isReviewerConfirmMode}
                activePayer={activeIntPayer}
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                fieldValues={{ ...fieldValues, withholding: totalWithholding }}
                onFieldValueChange={(key, value) => {
                  updateField(key as keyof typeof fieldValues, value)
                  markFieldEdited(String(key))
                }}
                onAmountChange={(patch, editedKey) => {
                  updateAmounts(patch)
                  if (editedKey) markFieldEdited(editedKey)
                  else touchDirty()
                }}
                amounts={amounts}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                unsavedFields={unsavedFields}
                recalculatedFields={recalculatedFields}
                editedFieldsMeta={editedFieldsMeta}
                fieldOverrides={fieldOverrides}
                onFieldOverride={handleFieldOverride}
                verifiedDocs={verifiedDocs}
                verifiedDocsMeta={verifiedDocsMeta}
                onVerifyDoc={handleVerifyDoc}
                reviewerConfirmedDocs={reviewerConfirmedDocs}
                reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                flaggedFields={importFlagsForDisplay({
                  taxableInterest: PHASE1_FLAG_MESSAGES.int.taxableInterest,
                })}
              />
            )}
            {activeTopTab === '1099-rs' && (
              <DetailFields1099R
                importReadOnly={isReviewerConfirmMode}
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                amounts={amounts}
                onAmountChange={(patch, editedKey) => {
                  updateAmounts(patch)
                  if (editedKey) markFieldEdited(editedKey)
                  else touchDirty()
                }}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                unsavedFields={unsavedFields}
                recalculatedFields={recalculatedFields}
                fieldOverrides={fieldOverrides}
                onFieldOverride={handleFieldOverride}
                verifiedDocs={verifiedDocs}
                verifiedDocsMeta={verifiedDocsMeta}
                onVerifyDoc={handleVerifyDoc}
                reviewerConfirmedDocs={reviewerConfirmedDocs}
                reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                flaggedFields={importFlagsForDisplay({
                  grossDistrib: PHASE1_FLAG_MESSAGES.r.grossDistrib,
                })}
              />
            )}
            {activeTopTab === '1099-necs' && (
              <DetailFieldsNec
                importReadOnly={isReviewerConfirmMode}
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                amounts={amounts}
                onAmountChange={(patch, editedKey) => {
                  updateAmounts(patch)
                  if (editedKey) markFieldEdited(editedKey)
                  else touchDirty()
                }}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                unsavedFields={unsavedFields}
                recalculatedFields={recalculatedFields}
                fieldOverrides={fieldOverrides}
                onFieldOverride={handleFieldOverride}
                verifiedDocs={verifiedDocs}
                verifiedDocsMeta={verifiedDocsMeta}
                onVerifyDoc={handleVerifyDoc}
                reviewerConfirmedDocs={reviewerConfirmedDocs}
                reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
                flaggedFields={importFlagsForDisplay({
                  'nec-box1': PHASE1_FLAG_MESSAGES.nec.necBox1,
                })}
              />
            )}
            {activeTopTab === 'questionnaire' && (
              <QuestionnaireResponsesPanel
                verifiedDocs={verifiedDocs}
                verifiedDocsMeta={verifiedDocsMeta}
                onVerifyDoc={handleVerifyDoc}
                reviewerConfirmedDocs={reviewerConfirmedDocs}
                reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
              />
            )}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <Button priority="tertiary" onClick={requestClose}>
          Cancel
        </Button>
        <div className={styles.footerActions}>
          <Button priority="primary" onClick={handleSaveAndRecalculate}>
            Save and recalculate return
          </Button>
        </div>
      </footer>

      <UnsavedChangesModal
        open={unsavedModalOpen}
        onStay={handleStayEditing}
        onLeaveWithoutSaving={handleLeaveWithoutSaving}
      />
    </div>
  )
}
