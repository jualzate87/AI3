import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setReviewActor } from '../hooks/useSyncedReviewState'
import {
  detectHandoff,
  getReturnStatus,
  getTeamMember,
  loadReturnWorkflow,
  saveReturnWorkflow,
  REVIEWER_WELCOME_KEY,
  type PendingHandoff,
  type ReturnStatusId,
  type ReturnWorkflowState,
} from '../lib/returnWorkflow'

type ReturnWorkflowContextValue = {
  workflow: ReturnWorkflowState
  currentUser: ReturnType<typeof getTeamMember>
  assignee: ReturnType<typeof getTeamMember>
  status: ReturnType<typeof getReturnStatus>
  pendingHandoff: PendingHandoff | null
  requestAssigneeChange: (assigneeId: string) => void
  requestStatusChange: (statusId: ReturnStatusId) => void
  confirmHandoff: (notes: string) => {
    assigneeId: string
    statusId: ReturnStatusId
    notes: string
  }
  dismissHandoff: () => void
  applyWorkflowPatch: (patch: Partial<ReturnWorkflowState>) => void
}

const ReturnWorkflowContext = createContext<ReturnWorkflowContextValue | null>(null)

export function ReturnWorkflowProvider({ children }: { children: ReactNode }) {
  const [workflow, setWorkflow] = useState<ReturnWorkflowState>(() => loadReturnWorkflow())
  const [pendingHandoff, setPendingHandoff] = useState<PendingHandoff | null>(null)

  const persist = useCallback((next: ReturnWorkflowState) => {
    setWorkflow(next)
    saveReturnWorkflow(next)
  }, [])

  useEffect(() => {
    setReviewActor(getTeamMember(workflow.currentUserId).name)
  }, [workflow.currentUserId])

  const applyWorkflowPatch = useCallback(
    (patch: Partial<ReturnWorkflowState>) => {
      persist({ ...workflow, ...patch })
    },
    [persist, workflow],
  )

  const requestAssigneeChange = useCallback(
    (assigneeId: string) => {
      if (assigneeId === workflow.assigneeId) return

      const handoff = detectHandoff(workflow.assigneeId, assigneeId, workflow.statusId)
      if (handoff) {
        setPendingHandoff(handoff)
        return
      }

      persist({ ...workflow, assigneeId })
    },
    [persist, workflow],
  )

  const requestStatusChange = useCallback(
    (statusId: ReturnStatusId) => {
      if (statusId === workflow.statusId) return
      persist({ ...workflow, statusId })
    },
    [persist, workflow],
  )

  const confirmHandoff = useCallback(
    (notes: string) => {
      if (!pendingHandoff) {
        return { assigneeId: workflow.assigneeId, statusId: workflow.statusId, notes }
      }

      const next: ReturnWorkflowState = {
        ...workflow,
        assigneeId: pendingHandoff.toAssigneeId,
        statusId: pendingHandoff.suggestedStatusId,
      }
      persist(next)
      setPendingHandoff(null)
      const nextAssignee = getTeamMember(next.assigneeId)
      if (nextAssignee.role === 'reviewer') {
        sessionStorage.setItem(REVIEWER_WELCOME_KEY, '1')
      }
      return {
        assigneeId: next.assigneeId,
        statusId: next.statusId,
        notes,
      }
    },
    [pendingHandoff, persist, workflow],
  )

  const dismissHandoff = useCallback(() => {
    if (!pendingHandoff) return
    persist({ ...workflow, assigneeId: pendingHandoff.toAssigneeId })
    setPendingHandoff(null)
  }, [pendingHandoff, persist, workflow])

  const value = useMemo(
    (): ReturnWorkflowContextValue => ({
      workflow,
      currentUser: getTeamMember(workflow.currentUserId),
      assignee: getTeamMember(workflow.assigneeId),
      status: getReturnStatus(workflow.statusId),
      pendingHandoff,
      requestAssigneeChange,
      requestStatusChange,
      confirmHandoff,
      dismissHandoff,
      applyWorkflowPatch,
    }),
    [
      workflow,
      pendingHandoff,
      requestAssigneeChange,
      requestStatusChange,
      confirmHandoff,
      dismissHandoff,
      applyWorkflowPatch,
    ],
  )

  return (
    <ReturnWorkflowContext.Provider value={value}>{children}</ReturnWorkflowContext.Provider>
  )
}

export function useReturnWorkflow(): ReturnWorkflowContextValue {
  const ctx = useContext(ReturnWorkflowContext)
  if (!ctx) {
    throw new Error('useReturnWorkflow must be used within ReturnWorkflowProvider')
  }
  return ctx
}
