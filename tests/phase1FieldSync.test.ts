import { describe, expect, it } from 'vitest'
import {
  countPhase1FlagsForW2Payer,
  countPhase1FlagsForW2Tab,
  countUncorrectedCriticalFlagsForDoc,
  docHasUncorrectedCriticalFlags,
  getDocVerifyBlockedMessage,
  getPhase1FlagKeysForVerifiedDoc,
  getTabFlagCounts,
  isBox12FlagResolved,
  isPhase1FlagResolved,
  PHASE1_FLAG_KEYS,
} from '../src/pages/data-review/phase1FieldSync'

function reviewed(...keys: string[]) {
  return new Map(keys.map(k => [k, { by: 'test', at: 'now' }]))
}

describe('W-2 Phase 1 flag counting', () => {
  it('counts all four Tech Circle flags when nothing is reviewed', () => {
    const empty = new Map<string, unknown>()
    expect(countPhase1FlagsForW2Payer('techCircle', empty)).toBe(4)
    expect(countPhase1FlagsForW2Payer('bingEquipment', empty)).toBe(4)
    expect(countPhase1FlagsForW2Tab(empty)).toBe(7)
    expect(getTabFlagCounts(empty).w2s).toBe(7)
  })

  it('drops wages from count when that key is reviewed', () => {
    const fields = reviewed('wages-techCircle')
    expect(countPhase1FlagsForW2Payer('techCircle', fields)).toBe(3)
  })

  it('identifies the remaining flags when wages is done', () => {
    const fields = reviewed('wages-techCircle')
    const w2Flags = PHASE1_FLAG_KEYS.filter(k =>
      ['ssn-techCircle', 'wages-techCircle', 'box12', 'ein-techCircle'].includes(k),
    )
    const unresolved = w2Flags.filter(k => !isPhase1FlagResolved(k, fields))
    expect(unresolved).toEqual(['ssn-techCircle', 'box12', 'ein-techCircle'])
    expect(unresolved.length).toBe(3)
  })

  it('clears box12 when all sub-rows are reviewed', () => {
    const fields = reviewed(
      'box12a-techCircle',
      'box12b-techCircle',
      'box12c-techCircle',
      'box12d-techCircle',
    )
    expect(isBox12FlagResolved(fields)).toBe(true)
    expect(isPhase1FlagResolved('box12', fields)).toBe(true)
    expect(countPhase1FlagsForW2Payer('techCircle', fields)).toBe(3)
  })

  it('clears box12 when the aggregate box12 key is reviewed directly', () => {
    const fields = reviewed('box12')
    expect(isBox12FlagResolved(fields)).toBe(true)
  })

  it('keeps Bing Equipment peel-tab count aligned with unresolved detail flags', () => {
    const empty = new Map<string, unknown>()
    expect(countPhase1FlagsForW2Payer('bingEquipment', empty)).toBe(4)
    const fields = reviewed('ssn-bingEquipment', 'wages-bingEquipment')
    expect(countPhase1FlagsForW2Payer('bingEquipment', fields)).toBe(2)
  })

  it('counts remaining Tech Circle peel-tab flags after one field is reviewed', () => {
    const fields = reviewed('wages-techCircle')
    expect(countPhase1FlagsForW2Payer('techCircle', fields)).toBe(3)
  })

  it('hides W-2 badges when all Phase 1 flags are resolved for both employers', () => {
    const fields = reviewed(
      'ssn-techCircle',
      'wages-techCircle',
      'box12',
      'ein-techCircle',
      'ssn-bingEquipment',
      'wages-bingEquipment',
      'ein-bingEquipment',
    )
    expect(countPhase1FlagsForW2Payer('techCircle', fields)).toBe(0)
    expect(countPhase1FlagsForW2Payer('bingEquipment', fields)).toBe(0)
    expect(countPhase1FlagsForW2Tab(fields)).toBe(0)
    expect(getTabFlagCounts(fields).w2s).toBe(0)
  })
})

describe('Phase 1 flag total', () => {
  it('tracks eleven import flags across all document types', () => {
    expect(PHASE1_FLAG_KEYS.length).toBe(11)
    const empty = new Map<string, unknown>()
    const total = PHASE1_FLAG_KEYS.filter(k => !isPhase1FlagResolved(k, empty)).length
    expect(total).toBe(11)
    expect(getTabFlagCounts(empty)['1099-rs']).toBe(1)
    expect(getTabFlagCounts(empty)['1099-necs']).toBe(1)
  })
})

describe('getPhase1FlagKeysForVerifiedDoc', () => {
  it('returns Bing Equipment W-2 flags (no box12 sub-rows)', () => {
    expect(getPhase1FlagKeysForVerifiedDoc('bingEquipment')).toEqual([
      'ssn-bingEquipment',
      'wages-bingEquipment',
      'box12',
      'ein-bingEquipment',
    ])
  })

  it('returns all Tech Circle W-2 flags plus box12 sub-rows', () => {
    const keys = getPhase1FlagKeysForVerifiedDoc('techCircle')
    expect(keys).toEqual(expect.arrayContaining([
      'ssn-techCircle',
      'wages-techCircle',
      'box12',
      'ein-techCircle',
      'box12a-techCircle',
      'box12b-techCircle',
      'box12c-techCircle',
      'box12d-techCircle',
    ]))
  })

  it('returns INT interest flag for Unwavering', () => {
    expect(getPhase1FlagKeysForVerifiedDoc('1099-int-unwaverIngFinancial')).toEqual([
      'taxableInterest',
    ])
  })

  it('returns DIV primary payer flags', () => {
    expect(getPhase1FlagKeysForVerifiedDoc('1099-div-tokenFinancial')).toEqual([
      'divCollectibles',
      'divNonDiv',
      'fedTaxWithheld',
    ])
  })

  it('returns 1099-R Meridian flag', () => {
    expect(getPhase1FlagKeysForVerifiedDoc('1099-r')).toEqual(['grossDistrib-meridian'])
  })

  it('returns NEC Summit Box 1 flag', () => {
    expect(getPhase1FlagKeysForVerifiedDoc('1099-nec')).toEqual(['nec-box1'])
  })
})

describe('countUncorrectedCriticalFlagsForDoc', () => {
  it('counts unresolved Tech Circle W-2 flags', () => {
    const empty = new Map<string, unknown>()
    expect(countUncorrectedCriticalFlagsForDoc('techCircle', empty)).toBe(4)
    expect(docHasUncorrectedCriticalFlags('techCircle', empty)).toBe(true)
  })

  it('counts unresolved Bing Equipment W-2 flags', () => {
    const empty = new Map<string, unknown>()
    expect(countUncorrectedCriticalFlagsForDoc('bingEquipment', empty)).toBe(4)
    expect(docHasUncorrectedCriticalFlags('bingEquipment', empty)).toBe(true)
    const cleared = reviewed(
      'ssn-bingEquipment',
      'wages-bingEquipment',
      'box12',
      'ein-bingEquipment',
    )
    expect(countUncorrectedCriticalFlagsForDoc('bingEquipment', cleared)).toBe(0)
  })

  it('returns zero for documents without import flags', () => {
    const empty = new Map<string, unknown>()
    expect(countUncorrectedCriticalFlagsForDoc('1099-div-beaconDividend', empty)).toBe(0)
    expect(docHasUncorrectedCriticalFlags('1099-div-beaconDividend', empty)).toBe(false)
  })

  it('counts unresolved NEC Summit flag', () => {
    const empty = new Map<string, unknown>()
    expect(countUncorrectedCriticalFlagsForDoc('1099-nec', empty)).toBe(1)
    expect(docHasUncorrectedCriticalFlags('1099-nec', empty)).toBe(true)
    const cleared = reviewed('nec-box1')
    expect(countUncorrectedCriticalFlagsForDoc('1099-nec', cleared)).toBe(0)
    expect(getTabFlagCounts(cleared)['1099-necs']).toBe(0)
  })

  it('uses singular blocked message copy for one flag', () => {
    expect(getDocVerifyBlockedMessage(1)).toContain('critical flagged issue')
  })

  it('uses plural blocked message copy for multiple flags', () => {
    expect(getDocVerifyBlockedMessage(3)).toContain('3 critical flagged issues')
  })
})
