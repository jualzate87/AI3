import { W2_PAYER_TABS } from '../pages/data-review/DetailFields'
import { DIV_PAYER_TABS } from '../pages/data-review/DetailFieldsDiv'
import { INT_PAYER_TABS } from '../pages/data-review/DetailFields1099'
import type { TopTab } from '../pages/data-review/ReviewTab'
import { getDocumentImportMeta } from './documentImportMeta'
import type { ReviewFormType } from './documentLibrary'

export type ReviewInputScreen = {
  id: string
  label: string
  topTab: TopTab
  docKey: string
  formType: ReviewFormType
  importReady: boolean
}

function isImportReady(docKey: string): boolean {
  const mode = getDocumentImportMeta(docKey)?.importMode
  return mode === 'api-filed' || mode === 'extracted'
}

/** All return inputs available in Input return - used in Add source flow. */
export const REVIEW_INPUT_SCREENS: ReviewInputScreen[] = [
  ...W2_PAYER_TABS.map(t => ({
    id: `w2-${t.key}`,
    label: `W-2 - ${t.label}`,
    topTab: 'w2s' as const,
    docKey: t.key,
    formType: 'W-2' as const,
    importReady: isImportReady(t.key),
  })),
  ...DIV_PAYER_TABS.map(t => ({
    id: `div-${t.key}`,
    label: `1099-DIV - ${t.label}`,
    topTab: '1099-divs' as const,
    docKey: t.key,
    formType: '1099-DIV' as const,
    importReady: isImportReady(t.key),
  })),
  ...INT_PAYER_TABS.map(t => ({
    id: `int-${t.key}`,
    label: `1099-INT - ${t.label}`,
    topTab: '1099-ints' as const,
    docKey: t.key,
    formType: '1099-INT' as const,
    importReady: isImportReady(t.key),
  })),
  {
    id: '1099-r-meridian',
    label: '1099-R - Meridian Retirement Trust',
    topTab: '1099-rs',
    docKey: '1099-r',
    formType: '1099-R',
    importReady: isImportReady('1099-r'),
  },
  {
    id: '1099-nec-summit',
    label: '1099-NEC - Summit Advisory Partners',
    topTab: '1099-necs',
    docKey: '1099-nec',
    formType: '1099-NEC',
    importReady: isImportReady('1099-nec'),
  },
]

export function reviewInputScreenById(id: string | null | undefined): ReviewInputScreen | null {
  if (!id) return null
  return REVIEW_INPUT_SCREENS.find(s => s.id === id) ?? null
}

export function inputScreensForTopTab(topTab: TopTab): ReviewInputScreen[] {
  return REVIEW_INPUT_SCREENS.filter(s => s.topTab === topTab)
}
