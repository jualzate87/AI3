import { W2_PAYER_TABS, type W2Employer } from '../pages/data-review/DetailFields'
import { DIV_PAYER_TABS, type DivPayer } from '../pages/data-review/DetailFieldsDiv'
import { INT_PAYER_TABS, type IntPayer } from '../pages/data-review/DetailFields1099'
import type { TopTab } from '../pages/data-review/ReviewTab'
import type { InputNavItemId } from './inputMenuNav'
import { navigationForVerifiedDocKey } from './verifiedDocKeys'

export const INPUT_FORM_PARAM = 'form'
export const INPUT_DOC_PARAM = 'doc'
/** Detail field to highlight in the input form panel. */
export const INPUT_FIELD_PARAM = 'field'

const SOURCE_DOC_TOP_TABS = new Set<TopTab>([
  'w2s',
  '1099-divs',
  '1099-ints',
  '1099-rs',
  '1099-necs',
  'questionnaire',
])

export type InputDocTab = { key: string; label: string }

/** L2 document instances for a form type (employer / payer tabs). */
export function getInputDocTabs(topTab: TopTab): InputDocTab[] {
  switch (topTab) {
    case 'w2s':
      return W2_PAYER_TABS
    case '1099-divs':
      return DIV_PAYER_TABS
    case '1099-ints':
      return INT_PAYER_TABS
    default:
      return []
  }
}

export function getDefaultDocKey(topTab: TopTab): string | null {
  const tabs = getInputDocTabs(topTab)
  return tabs[0]?.key ?? null
}

export function isValidDocKey(topTab: TopTab, docKey: string | null | undefined): docKey is string {
  if (!docKey) return false
  return getInputDocTabs(topTab).some(t => t.key === docKey)
}

/** Resolve URL `doc` param from a canonical verified-doc key (activity log / handoff jumps). */
export function docKeyFromVerifiedDocId(docId: string): string | null {
  const nav = navigationForVerifiedDocKey(docId)
  if (!nav) return null
  if (nav.subTab) return nav.subTab
  if (nav.divPayer) return nav.divPayer
  if (nav.intPayer) return nav.intPayer
  return null
}

/** Apply deep-link / popout navigation context to review panel tab state. */
export function applySourceDocumentPopoutContext(
  context: {
    tab?: string
    subTab?: string
    divPayer?: string
    intPayer?: string
    field?: string
  },
  handlers: {
    setActiveTopTab: (tab: TopTab) => void
    setActiveSubTab: (subTab: W2Employer) => void
    setActiveDivPayer: (payer: DivPayer) => void
    setActiveIntPayer: (payer: IntPayer) => void
    setSelectedField: (field: string | null) => void
  },
): void {
  const tab = context.tab as TopTab | undefined
  if (tab && SOURCE_DOC_TOP_TABS.has(tab)) {
    handlers.setActiveTopTab(tab)
  }

  const activeTab = tab && SOURCE_DOC_TOP_TABS.has(tab) ? tab : undefined

  if (
    (activeTab === 'w2s' || !activeTab)
    && isValidDocKey('w2s', context.subTab)
  ) {
    handlers.setActiveSubTab(context.subTab as W2Employer)
  }
  if (
    (activeTab === '1099-divs' || !activeTab)
    && isValidDocKey('1099-divs', context.divPayer)
  ) {
    handlers.setActiveDivPayer(context.divPayer as DivPayer)
  }
  if (
    (activeTab === '1099-ints' || !activeTab)
    && isValidDocKey('1099-ints', context.intPayer)
  ) {
    handlers.setActiveIntPayer(context.intPayer as IntPayer)
  }

  if (context.field) {
    handlers.setSelectedField(context.field)
  }
}

export function applyInputDocKey(
  topTab: TopTab,
  docKey: string,
  setters: {
    setActiveSubTab: (tab: W2Employer) => void
    setActiveDivPayer: (payer: DivPayer) => void
    setActiveIntPayer: (payer: IntPayer) => void
  },
): void {
  switch (topTab) {
    case 'w2s':
      setters.setActiveSubTab(docKey as W2Employer)
      break
    case '1099-divs':
      setters.setActiveDivPayer(docKey as DivPayer)
      break
    case '1099-ints':
      setters.setActiveIntPayer(docKey as IntPayer)
      break
    default:
      break
  }
}

export function readActiveDocKey(
  topTab: TopTab,
  state: { activeSubTab: W2Employer; activeDivPayer: DivPayer; activeIntPayer: IntPayer },
): string | null {
  switch (topTab) {
    case 'w2s':
      return state.activeSubTab
    case '1099-divs':
      return state.activeDivPayer
    case '1099-ints':
      return state.activeIntPayer
    default:
      return null
  }
}

/** Resolve `doc` query param for a form type; falls back to the first tab. */
export function resolveDocKeyFromUrl(
  topTab: TopTab,
  docParam: string | null | undefined,
): string | null {
  if (isValidDocKey(topTab, docParam ?? undefined)) return docParam!
  return getDefaultDocKey(topTab)
}

/** Write form + doc query params for input-return deep links. */
export function writeInputReturnParams(
  params: URLSearchParams,
  formId: InputNavItemId,
  topTab?: TopTab,
  docKey?: string | null,
): void {
  params.set(INPUT_FORM_PARAM, formId)
  if (!topTab) {
    params.delete(INPUT_DOC_PARAM)
    return
  }
  const tabs = getInputDocTabs(topTab)
  if (tabs.length > 1) {
    const doc =
      docKey && isValidDocKey(topTab, docKey) ? docKey : getDefaultDocKey(topTab)
    if (doc) params.set(INPUT_DOC_PARAM, doc)
    else params.delete(INPUT_DOC_PARAM)
  } else {
    params.delete(INPUT_DOC_PARAM)
  }
}
