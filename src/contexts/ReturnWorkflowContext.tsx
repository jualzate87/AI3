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
  detectStatusHandoff,
  getReturnStatus,
  getTeamMember,
  loadReturnWorkflow,
  saveReturnWorkflow,
  REVIEWER_WELCOME_KEY,
  WORKFLOW_CHANGED_EVENT,
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
  confirmHandoff: (notes: string, updateStatus?: boolean) => {
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

  useEffect(() => {
    const sync = () => setWorkflow(loadReturnWorkflow())
    window.addEventListener(WORKFLOW_CHANGED_EVENT, sync)
    return () => window.removeEventListener(WORKFLOW_CHANGED_EVENT, sync)
  }, [])

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
        // Let the select-menu click finish before mounting the modal backdrop.
        // Otherwise the same pointer event can immediately dismiss the new dialog.
        window.setTimeout(() => setPendingHandoff(handoff), 0)
        return
      }

      persist({ ...workflow, assigneeId })
    },
    [persist, workflow],
  )

  const requestStatusChange = useCallback(
    (statusId: ReturnStatusId) => {
      if (statusId === workflow.statusId) return

      const handoff = detectStatusHandoff(workflow.assigneeId, workflow.statusId, statusId)
      if (handoff) {
        window.setTimeout(() => setPendingHandoff(handoff), 0)
        return
      }

      persist({ ...workflow, statusId })
    },
    [persist, workflow],
  )

  const confirmHandoff = useCallback(
    (notes: string, updateStatus = true) => {
      if (!pendingHandoff) {
        return { assigneeId: workflow.assigneeId, statusId: workflow.statusId, notes }
      }

      const next: ReturnWorkflowState = {
        ...workflow,
        assigneeId: pendingHandoff.toAssigneeId,
        statusId: updateStatus ? pendingHandoff.suggestedStatusId : workflow.statusId,
      }
      persist(next)
      setPendingHandoff(null)
      const nextAssignee = getTeamMember(next.assigneeId)
      if (pendingHandoff.kind === 'assignee' && nextAssignee.role === 'reviewer') {
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

  /** Close the assist modal without applying the pending handoff. */
  const dismissHandoff = useCallback(() => {
    setPendingHandoff(null)
  }, [])

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
