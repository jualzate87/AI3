import { useCallback, useEffect, useRef, useState } from 'react'
import { INTELLIGENCE_FIX_PROGRESS_SECTIONS } from './agentIntelligenceCopy'

/** Slow, readable pacing — batch mode auto-plays; sequential pauses between fixes */
const REASONING_HEADER_DELAY_MS = 400
const REASONING_STEP_GAP_MS = 1200
const REASONING_EXIT_MS = 600
const RESULTS_START_DELAY_MS = 200
const FIX_SECTION_REVEAL_MS = 500
const PROGRESS_COMPLETE_GAP_MS = 400
const SUGGESTION_CHIPS_DELAY_MS = 300
const SEQUENTIAL_REASONING_MS = 1800

const REASONING_STEP_COUNT = 3
const FIX_SECTION_COUNT = INTELLIGENCE_FIX_PROGRESS_SECTIONS.length
/** lead + fix sections + reminder + footer */
const RESULTS_TAIL_COUNT = 2

export type ProcessingMode = 'batch' | 'sequential'
export type ProcessingPhase = 'reasoning' | 'results'

export function useAgentProcessingAnimation(mode: ProcessingMode = 'batch') {
  const [phase, setPhase] = useState<ProcessingPhase>('reasoning')
  const [reasoningHeaderVisible, setReasoningHeaderVisible] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [reasoningExiting, setReasoningExiting] = useState(false)
  const [resultsVisible, setResultsVisible] = useState(false)
  const [visibleFixSections, setVisibleFixSections] = useState(0)
  const [showReminder, setShowReminder] = useState(false)
  const [showFooter, setShowFooter] = useState(false)
  const [activeProgressIndex, setActiveProgressIndex] = useState(-1)
  const [completedProgress, setCompletedProgress] = useState(0)
  const [showSuggestionChips, setShowSuggestionChips] = useState(false)
  const [awaitingContinue, setAwaitingContinue] = useState(false)
  const [allFixesComplete, setAllFixesComplete] = useState(false)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }, [])

  const revealFixSection = useCallback(
    (sectionIndex: number, onDone?: () => void) => {
      schedule(() => {
        setVisibleFixSections(sectionIndex)
        setCompletedProgress(sectionIndex)
        setActiveProgressIndex(-1)
      }, 0)

      if (sectionIndex >= FIX_SECTION_COUNT) {
        schedule(() => {
          setShowReminder(true)
          setCompletedProgress(FIX_SECTION_COUNT)
        }, FIX_SECTION_REVEAL_MS)
        schedule(() => setShowFooter(true), FIX_SECTION_REVEAL_MS * 2)
        schedule(() => {
          setShowSuggestionChips(true)
          setAllFixesComplete(true)
          setAwaitingContinue(false)
          onDone?.()
        }, FIX_SECTION_REVEAL_MS * 2 + SUGGESTION_CHIPS_DELAY_MS)
        return
      }

      schedule(() => {
        if (mode === 'sequential') {
          setAwaitingContinue(true)
        }
        onDone?.()
      }, FIX_SECTION_REVEAL_MS)
    },
    [mode, schedule],
  )

  const startResults = useCallback(() => {
    setPhase('results')
    setReasoningExiting(false)
    setResultsVisible(true)
    setActiveProgressIndex(0)
    revealFixSection(1)
  }, [revealFixSection])

  const advanceToNextFix = useCallback(() => {
    if (!awaitingContinue || allFixesComplete) return
    setAwaitingContinue(false)
    const next = visibleFixSections + 1
    if (next > FIX_SECTION_COUNT) return
    setActiveProgressIndex(next - 1)
    revealFixSection(next)
  }, [allFixesComplete, awaitingContinue, revealFixSection, visibleFixSections])

  useEffect(() => {
    clearTimers()

    if (mode === 'sequential') {
      schedule(() => setReasoningHeaderVisible(true), 0)
      schedule(() => setVisibleSteps(1), REASONING_HEADER_DELAY_MS)
      schedule(() => setReasoningExiting(true), SEQUENTIAL_REASONING_MS)
      schedule(() => startResults(), SEQUENTIAL_REASONING_MS + REASONING_EXIT_MS)
      return clearTimers
    }

    let elapsed = 0
    schedule(() => setReasoningHeaderVisible(true), elapsed)
    elapsed += REASONING_HEADER_DELAY_MS

    for (let step = 1; step <= REASONING_STEP_COUNT; step += 1) {
      const stepIndex = step
      schedule(() => {
        setVisibleSteps(stepIndex)
        setActiveProgressIndex(stepIndex - 1)
      }, elapsed)
      elapsed += REASONING_STEP_GAP_MS
    }

    schedule(() => setReasoningExiting(true), elapsed)
    elapsed += REASONING_EXIT_MS

    schedule(() => {
      setPhase('results')
      setReasoningExiting(false)
      setActiveProgressIndex(-1)
      setResultsVisible(true)
    }, elapsed)
    elapsed += RESULTS_START_DELAY_MS

    for (let i = 1; i <= FIX_SECTION_COUNT; i += 1) {
      const count = i
      schedule(() => {
        setVisibleFixSections(count)
        setCompletedProgress(count)
      }, elapsed)
      elapsed += FIX_SECTION_REVEAL_MS + PROGRESS_COMPLETE_GAP_MS
    }

    schedule(() => setShowReminder(true), elapsed)
    elapsed += FIX_SECTION_REVEAL_MS
    schedule(() => setShowFooter(true), elapsed)
    elapsed += FIX_SECTION_REVEAL_MS
    schedule(() => {
      setShowSuggestionChips(true)
      setAllFixesComplete(true)
    }, elapsed + SUGGESTION_CHIPS_DELAY_MS)

    return clearTimers
  }, [mode, schedule, startResults])

  return {
    phase,
    reasoningHeaderVisible,
    visibleSteps,
    reasoningExiting,
    resultsVisible,
    visibleFixSections,
    showReminder,
    showFooter,
    activeProgressIndex,
    completedProgress,
    showSuggestionChips,
    awaitingContinue,
    allFixesComplete,
    advanceToNextFix,
    fixSectionCount: FIX_SECTION_COUNT,
    resultsTailCount: RESULTS_TAIL_COUNT,
  }
}
