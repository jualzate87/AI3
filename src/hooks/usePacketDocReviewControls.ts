import { useCallback, useMemo } from 'react'
import type { W2Employer } from '../pages/data-review/DetailFields'
import type { DivPayer } from '../pages/data-review/DetailFieldsDiv'
import type { IntPayer } from '../pages/data-review/DetailFields1099'
import type { TopTab } from '../pages/data-review/ReviewTab'
import {
  buildUnreviewedSourceDocs,
  navigateToPeelDocKey,
  navigateToTopTab,
  selectNextUnreviewedPacketDoc,
  type PacketDocNavSetters,
} from '../pages/data-review/packetDocNavigation'

type UsePacketDocReviewControlsArgs = {
  reviewedFields: Map<string, unknown>
  verifiedDocs: Set<string>
  activeTopTab: TopTab
  activeSubTab: W2Employer
  activeDivPayer: DivPayer
  activeIntPayer: IntPayer
  setActiveTopTab: (tab: TopTab) => void
  setActiveSubTab: (tab: W2Employer) => void
  setActiveDivPayer: (payer: DivPayer) => void
  setActiveIntPayer: (payer: IntPayer) => void
  setSelectedField: (field: string | null) => void
  toggleVerifiedDoc: (docKey: string) => void
  /** Optional - popout dirty-session tracking */
  onAfterMutation?: () => void
  /** Optional - e.g. open source panel before navigating on DataReviewPage */
  onBeforeNavigate?: () => void
}

/**
 * Shared Phase 1 packet navigation + mark-as-verified handlers.
 * Used by DataReviewPage source panel and DataReviewPopout so both stay in sync.
 */
export function usePacketDocReviewControls({
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
  onAfterMutation,
  onBeforeNavigate,
}: UsePacketDocReviewControlsArgs) {
  const navSetters: PacketDocNavSetters = useMemo(
    () => ({
      setActiveTopTab,
      setActiveSubTab,
      setActiveDivPayer,
      setActiveIntPayer,
      setSelectedField,
    }),
    [
      setActiveTopTab,
      setActiveSubTab,
      setActiveDivPayer,
      setActiveIntPayer,
      setSelectedField,
    ],
  )

  const unreviewedSourceDocs = useMemo(
    () => buildUnreviewedSourceDocs({ verifiedDocs, reviewedFields }),
    [verifiedDocs, reviewedFields],
  )

  const unreviewedDocCount = unreviewedSourceDocs.length

  const handleTopTabChange = useCallback(
    (tab: TopTab) => {
      onBeforeNavigate?.()
      navigateToTopTab(tab, navSetters)
    },
    [navSetters, onBeforeNavigate],
  )

  const handlePeelDocChange = useCallback(
    (docKey: string) => {
      onBeforeNavigate?.()
      navigateToPeelDocKey(activeTopTab, docKey, navSetters)
    },
    [activeTopTab, navSetters, onBeforeNavigate],
  )

  const handleReviewNextDocument = useCallback(() => {
    onBeforeNavigate?.()
    selectNextUnreviewedPacketDoc(
      unreviewedSourceDocs,
      {
        tab: activeTopTab,
        w2SubTab: activeSubTab,
        divPayer: activeDivPayer,
        intPayer: activeIntPayer,
      },
      navSetters,
    )
  }, [
    unreviewedSourceDocs,
    activeTopTab,
    activeSubTab,
    activeDivPayer,
    activeIntPayer,
    navSetters,
    onBeforeNavigate,
  ])

  const handleVerifyDoc = useCallback(
    (docKey: string) => {
      toggleVerifiedDoc(docKey)
      onAfterMutation?.()
    },
    [toggleVerifiedDoc, onAfterMutation],
  )

  return {
    unreviewedSourceDocs,
    unreviewedDocCount,
    handleTopTabChange,
    handlePeelDocChange,
    handleReviewNextDocument,
    handleVerifyDoc,
  }
}
