import { useCallback, useEffect, useRef, useState } from 'react'
import { CATCH_UP_REASONING_STEPS } from './agentIntelligenceCopy'

const REASONING_HEADER_DELAY_MS = 200
const REASONING_STEP_GAP_MS = 900
const REASONING_EXIT_MS = 500
const GENERATING_START_DELAY_MS = 200
const BLOCK_REVEAL_MS = 480
const CONTROLS_DELAY_MS = 350

/** Content blocks revealed top-to-bottom after reasoning completes. */
export const CATCH_UP_CONTENT_BLOCK_COUNT = 7

export type CatchUpPhase = 'reasoning' | 'generating' | 'complete'

/**
 * @param instant Skip the stream and land on the finished summary — used when
 *   reopening a conversation that was already generated.
 */
export function useCatchUpAnimation(instant = false) {
  const [phase, setPhase] = useState<CatchUpPhase>(instant ? 'complete' : 'reasoning')
  const [reasoningHeaderVisible, setReasoningHeaderVisible] = useState(instant)
  const [visibleReasoningSteps, setVisibleReasoningSteps] = useState(
    instant ? CATCH_UP_REASONING_STEPS.length : 0,
  )
  const [reasoningExiting, setReasoningExiting] = useState(false)
  const [generatingVisible, setGeneratingVisible] = useState(instant)
  const [visibleBlocks, setVisibleBlocks] = useState(instant ? CATCH_UP_CONTENT_BLOCK_COUNT : 0)
  const [showControls, setShowControls] = useState(instant)
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
    if (instant) return
    clearTimers()
    let elapsed = REASONING_HEADER_DELAY_MS

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
  }, [clearTimers, instant, schedule])

  const isReasoning = phase === 'reasoning'
  const showGenerating = phase === 'generating' || phase === 'complete'

  return {
    phase,
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
