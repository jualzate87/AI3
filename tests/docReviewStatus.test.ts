import { describe, expect, it } from 'vitest'
import {
  canVerifyDoc,
  countDocsIncompleteForReviewer,
  countDocsNeedingReviewerConfirm,
  countVerifiedPacketDocs,
  getDocConfirmStatus,
  getDocVerifyIdentityBlockedHint,
  getDocVerifyIdentityBlockedMessage,
  getTechCircleIdentityGaps,
} from '../src/pages/data-review/docReviewStatus'

const DOC_KEYS = ['techCircle', '1099-r'] as const

describe('countDocsIncompleteForReviewer', () => {
  it('counts unverified docs when preparer has not verified', () => {
    const count = countDocsIncompleteForReviewer({
      verifiedDocs: new Set(),
      reviewerConfirmedDocs: new Set(),
      docKeys: DOC_KEYS,
    })
    expect(count).toBe(2)
  })

  it('counts needs-confirm docs after preparer verified but reviewer has not', () => {
    const count = countDocsIncompleteForReviewer({
      verifiedDocs: new Set(['techCircle', '1099-r']),
      reviewerConfirmedDocs: new Set(),
      docKeys: DOC_KEYS,
    })
    expect(count).toBe(2)
    expect(getDocConfirmStatus(new Set(['techCircle']), 'techCircle', new Set())).toBe('needs-confirm')
  })

  it('excludes reviewer-confirmed docs', () => {
    const count = countDocsIncompleteForReviewer({
      verifiedDocs: new Set(['techCircle', '1099-r']),
      reviewerConfirmedDocs: new Set(['techCircle']),
      docKeys: DOC_KEYS,
    })
    expect(count).toBe(1)
    expect(countDocsNeedingReviewerConfirm({
      verifiedDocs: new Set(['techCircle', '1099-r']),
      reviewerConfirmedDocs: new Set(['techCircle']),
      docKeys: DOC_KEYS,
    })).toBe(1)
  })
})

describe('canVerifyDoc — Tech Circle identity gate', () => {
  const emptyReviewed = new Map<string, unknown>()
  const clearedReviewed = new Map<string, unknown>([
    ['ssn-techCircle', {}],
    ['wages-techCircle', {}],
    ['box12', {}],
    ['ein-techCircle', {}],
  ])

  it('blocks techCircle when SSN and EIN are blank', () => {
    const result = canVerifyDoc({
      docKey: 'techCircle',
      reviewedFields: clearedReviewed,
      amounts: { employeeSsn: '', employerEin: '' },
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('missing-identity')
    expect(result.missingIdentityFields).toEqual(['ssn', 'ein'])
  })

  it('blocks techCircle when only SSN is missing', () => {
    const result = canVerifyDoc({
      docKey: 'techCircle',
      reviewedFields: clearedReviewed,
      amounts: { employeeSsn: '   ', employerEin: '12-3456789' },
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('missing-ssn')
  })

  it('allows techCircle when identity fields are filled and flags cleared', () => {
    const result = canVerifyDoc({
      docKey: 'techCircle',
      reviewedFields: clearedReviewed,
      amounts: { employeeSsn: '123-45-6789', employerEin: '12-3456789' },
    })
    expect(result).toEqual({ allowed: true })
  })

  it('allows techCircle verify even when critical flags remain (flags stay in state)', () => {
    const result = canVerifyDoc({
      docKey: 'techCircle',
      reviewedFields: emptyReviewed,
      amounts: { employeeSsn: '123-45-6789', employerEin: '12-3456789' },
    })
    expect(result).toEqual({ allowed: true })
  })

  it('does not gate non-techCircle W-2 docs on identity', () => {
    const result = canVerifyDoc({
      docKey: 'bingEquipment',
      reviewedFields: emptyReviewed,
      amounts: { employeeSsn: '', employerEin: '' },
    })
    expect(result).toEqual({ allowed: true })
  })

  it('skips identity gate for reviewer actor', () => {
    const result = canVerifyDoc({
      docKey: 'techCircle',
      reviewedFields: emptyReviewed,
      amounts: { employeeSsn: '', employerEin: '' },
      isReviewer: true,
    })
    expect(result).toEqual({ allowed: true })
  })
})

describe('identity block messages', () => {
  it('formats hint and message for missing fields', () => {
    expect(getTechCircleIdentityGaps({ employeeSsn: '', employerEin: '1' })).toEqual(['ssn'])
    expect(getDocVerifyIdentityBlockedHint(['ssn'])).toContain('SSN')
    expect(getDocVerifyIdentityBlockedMessage(['ein'])).toContain('EIN')
  })
})

describe('countVerifiedPacketDocs', () => {
  it('counts verified docs in the packet inventory', () => {
    const { verified, total } = countVerifiedPacketDocs({
      verifiedDocs: new Set(['techCircle', '1099-r']),
    })
    expect(verified).toBe(2)
    expect(total).toBeGreaterThan(2)
  })
})
