import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SmartReturnHeader from './SmartReturnHeader'
import ReturnContextRail from '../components/ReturnContextRail'
import LeftNavPTO from './data-review/LeftNavPTO'
import InputMenuNav from './input-return/InputMenuNav'
import { useNavigate } from 'react-router-dom'
import { OUTPUT_REVIEW_PATH } from '../lib/prototypeRoutes'
import InputFormPanel from './input-return/InputFormPanel'
import {
  inputNavItemById,
  type InputNavItemId,
} from '../data/inputMenuNav'
import {
  applyInputDocKey,
  getDefaultDocKey,
  INPUT_DOC_PARAM,
  INPUT_FORM_PARAM,
  readActiveDocKey,
  resolveDocKeyFromUrl,
  writeInputReturnParams,
} from '../data/inputDocTabs'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import layout from '../styles/CoreScreenLayout.module.css'
import styles from '../styles/InputReturnPage.module.css'

export default function InputReturnPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const formParam = searchParams.get(INPUT_FORM_PARAM) as InputNavItemId | null
  const docParam = searchParams.get(INPUT_DOC_PARAM)
  const diagnostic = searchParams.get('diagnostic')
  const [activeItemId, setActiveItemId] = useState<InputNavItemId>(
    () => inputNavItemById(formParam).id,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [navCollapsed, setNavCollapsed] = useState(false)

  const {
    activeTopTab,
    setActiveTopTab,
    activeSubTab,
    setActiveSubTab,
    activeDivPayer,
    setActiveDivPayer,
    activeIntPayer,
    setActiveIntPayer,
  } = useSyncedReviewState()

  const docSetters = { setActiveSubTab, setActiveDivPayer, setActiveIntPayer }

  useEffect(() => {
    const el = document.documentElement
    const prevTheme = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'intuit')
    el.style.setProperty('--color-action-standard', '#205ea3')
    el.style.setProperty('--color-action-standard-hover', '#174d87')
    el.style.setProperty('--color-action-standard-active', '#174d87')
    return () => {
      if (prevTheme) el.setAttribute('data-theme', prevTheme)
      el.style.removeProperty('--color-action-standard')
      el.style.removeProperty('--color-action-standard-hover')
      el.style.removeProperty('--color-action-standard-active')
    }
  }, [])

  useEffect(() => {
    if (formParam && formParam !== activeItemId) {
      setActiveItemId(inputNavItemById(formParam).id)
    }
  }, [formParam, activeItemId])

  useEffect(() => {
    const navItem = inputNavItemById(activeItemId)
    if (activeTopTab !== navItem.topTab) {
      setActiveTopTab(navItem.topTab)
    }
  }, [activeItemId, activeTopTab, setActiveTopTab])

  useEffect(() => {
    const navItem = inputNavItemById(activeItemId)
    const resolved = resolveDocKeyFromUrl(navItem.topTab, docParam)
    if (!resolved) return
    const current = readActiveDocKey(navItem.topTab, {
      activeSubTab,
      activeDivPayer,
      activeIntPayer,
    })
    if (current !== resolved) {
      applyInputDocKey(navItem.topTab, resolved, docSetters)
    }
  }, [docParam, activeItemId, activeSubTab, activeDivPayer, activeIntPayer, setActiveSubTab, setActiveDivPayer, setActiveIntPayer])

  const handleSelectItem = (id: InputNavItemId) => {
    setActiveItemId(id)
    const navItem = inputNavItemById(id)
    setActiveTopTab(navItem.topTab)
    const defaultDoc = getDefaultDocKey(navItem.topTab)
    if (defaultDoc) {
      applyInputDocKey(navItem.topTab, defaultDoc, docSetters)
    }
    const next = new URLSearchParams(searchParams)
    writeInputReturnParams(next, id, navItem.topTab, defaultDoc)
    setSearchParams(next, { replace: true })
  }

  const handleDocChange = (docKey: string) => {
    const navItem = inputNavItemById(activeItemId)
    applyInputDocKey(navItem.topTab, docKey, docSetters)
    const next = new URLSearchParams(searchParams)
    next.set(INPUT_DOC_PARAM, docKey)
    setSearchParams(next, { replace: true })
  }

  const activeDocKey = readActiveDocKey(inputNavItemById(activeItemId).topTab, {
    activeSubTab,
    activeDivPayer,
    activeIntPayer,
  })

  return (
    <div className={`${layout.page} ${styles.page}`} data-theme="intuit">
      <div className={layout.body}>
        <LeftNavPTO />
        <div className={layout.rightSide}>
          <SmartReturnHeader
            activeTab="inputreturn"
            showReviewReturn
            onReviewReturn={() => navigate(OUTPUT_REVIEW_PATH)}
          />

          <div className={styles.contentArea}>
            <InputMenuNav
              activeItemId={activeItemId}
              activeDocKey={activeDocKey}
              onSelect={handleSelectItem}
              onDocSelect={handleDocChange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              collapsed={navCollapsed}
              onCollapsedChange={setNavCollapsed}
            />
            <InputFormPanel
              activeItemId={activeItemId}
              showMissingEinDiagnostic={diagnostic === 'missing-ein'}
              onDocChange={handleDocChange}
            />
            <ReturnContextRail />
          </div>
        </div>
      </div>
    </div>
  )
}
