import { useCallback, useEffect, useRef, useState } from 'react'
import { CATCH_UP_REASONING_STEPS } from './agentIntelligenceCopy'

const LOADING_SPIN_MS = 700
const LOADING_GREETING_MS = 1500
const LOADING_EXIT_MS = 400
const REASONING_HEADER_DELAY_MS = 200
const REASONING_STEP_GAP_MS = 900
const REASONING_EXIT_MS = 500
const GENERATING_START_DELAY_MS = 200
const BLOCK_REVEAL_MS = 480
const CONTROLS_DELAY_MS = 350

/** Content blocks revealed top-to-bottom after reasoning completes. */
export const CATCH_UP_CONTENT_BLOCK_COUNT = 8

export type CatchUpPhase = 'loading' | 'reasoning' | 'generating' | 'complete'
export type CatchUpLoadingSubphase = 'spinning' | 'greeting' | 'exiting'

export function useCatchUpAnimation() {
  const [phase, setPhase] = useState<CatchUpPhase>('loading')
  const [loadingSubphase, setLoadingSubphase] = useState<CatchUpLoadingSubphase>('spinning')
  const [reasoningHeaderVisible, setReasoningHeaderVisible] = useState(false)
  const [visibleReasoningSteps, setVisibleReasoningSteps] = useState(0)
  const [reasoningExiting, setReasoningExiting] = useState(false)
  const [generatingVisible, setGeneratingVisible] = useState(false)
  const [visibleBlocks, setVisibleBlocks] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }, [])

  useEffect(() => {
    clearTimers()
    let elapsed = 0

    schedule(() => setLoadingSubphase('greeting'), LOADING_SPIN_MS)
    elapsed = LOADING_SPIN_MS + LOADING_GREETING_MS
    schedule(() => setLoadingSubphase('exiting'), elapsed)
    elapsed += LOADING_EXIT_MS
    schedule(() => {
      setPhase('reasoning')
      setLoadingSubphase('spinning')
    }, elapsed)

    elapsed += REASONING_HEADER_DELAY_MS
    schedule(() => setReasoningHeaderVisible(true), elapsed)

    for (let step = 1; step <= CATCH_UP_REASONING_STEPS.length; step += 1) {
      const stepIndex = step
      elapsed += REASONING_STEP_GAP_MS
      schedule(() => setVisibleReasoningSteps(stepIndex), elapsed)
    }

    elapsed += REASONING_STEP_GAP_MS
    schedule(() => setReasoningExiting(true), elapsed)
    elapsed += REASONING_EXIT_MS

    schedule(() => {
      setPhase('generating')
      setReasoningExiting(false)
      setGeneratingVisible(true)
    }, elapsed)
    elapsed += GENERATING_START_DELAY_MS

    for (let block = 1; block <= CATCH_UP_CONTENT_BLOCK_COUNT; block += 1) {
      const blockIndex = block
      schedule(() => setVisibleBlocks(blockIndex), elapsed)
      elapsed += BLOCK_REVEAL_MS
    }

    schedule(() => {
      setPhase('complete')
      setShowControls(true)
    }, elapsed + CONTROLS_DELAY_MS)

    return clearTimers
  }, [clearTimers, schedule])

  const isLoading = phase === 'loading'
  const isReasoning = phase === 'reasoning'
  const showGenerating = phase === 'generating' || phase === 'complete'

  return {
    phase,
    loadingSubphase,
    isLoading,
    isReasoning,
    reasoningHeaderVisible,
    visibleReasoningSteps,
    reasoningExiting,
    showGenerating,
    generatingVisible,
    visibleBlocks,
    showControls,
    reasoningStepCount: CATCH_UP_REASONING_STEPS.length,
  }
}
