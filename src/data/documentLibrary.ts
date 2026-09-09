import img1099IntHarborline from '../assets/source-docs/1099-int-harborline.jpg'
import img1099DivBeacon from '../assets/source-docs/1099-div-beacon.jpg'
import imgW2BingEquipment from '../assets/source-docs/w2-bing-equipment.png'

/** Uploaded client documents not yet linked to a review input. */
export type LibraryDocument = {
  id: string
  formType: 'W-2' | '1099-DIV' | '1099-INT' | '1099-R' | '1099-NEC'
  label: string
  payer: string
  imageSrc: string
  uploadedAt: string
}

export const DOCUMENT_LIBRARY: LibraryDocument[] = [
  {
    id: 'lib-w2-bing',
    formType: 'W-2',
    label: 'W-2 — Bing Equipment Co.',
    payer: 'Bing Equipment Co.',
    imageSrc: imgW2BingEquipment,
    uploadedAt: 'Mar 12, 2025',
  },
  {
    id: 'lib-1099-int-extra',
    formType: '1099-INT',
    label: '1099-INT — Community Bank (uploaded)',
    payer: 'Community Bank',
    imageSrc: img1099IntHarborline,
    uploadedAt: 'Mar 10, 2025',
  },
  {
    id: 'lib-1099-div-extra',
    formType: '1099-DIV',
    label: '1099-DIV — Oak Street Fund (uploaded)',
    payer: 'Oak Street Fund',
    imageSrc: img1099DivBeacon,
    uploadedAt: 'Mar 8, 2025',
  },
]

export type ReviewFormOption = {
  id: string
  formType: ReviewFormType
  label: string
  topTab: 'w2s' | '1099-divs' | '1099-ints' | '1099-rs' | '1099-necs'
  /** Existing verify doc key when linking manual input */
  verifyDocKey?: string
  subTabKey?: string
  importReady: boolean
}

export type ReviewFormType = 'W-2' | '1099-DIV' | '1099-INT' | '1099-R' | '1099-NEC'

/** Form types + existing inputs the preparer can add to the review queue. */
export const REVIEW_FORM_OPTIONS: ReviewFormOption[] = [
  {
    id: 'w2-techCircle',
    formType: 'W-2',
    label: 'W-2 — Tech Circle Inc (in return)',
    topTab: 'w2s',
    verifyDocKey: 'techCircle',
    subTabKey: 'techCircle',
    importReady: true,
  },
  {
    id: 'w2-bingEquipment',
    formType: 'W-2',
    label: 'W-2 — Bing Equipment (manual input)',
    topTab: 'w2s',
    verifyDocKey: 'bingEquipment',
    subTabKey: 'bingEquipment',
    importReady: false,
  },
  {
    id: '1099-int-new',
    formType: '1099-INT',
    label: '1099-INT — new payer (import ready)',
    topTab: '1099-ints',
    verifyDocKey: '1099-int',
    subTabKey: 'unwaverIngFinancial',
    importReady: true,
  },
  {
    id: '1099-r-meridian',
    formType: '1099-R',
    label: '1099-R — Meridian (PDF only)',
    topTab: '1099-rs',
    verifyDocKey: '1099-r',
    subTabKey: 'meridian',
    importReady: false,
  },
  {
    id: '1099-nec-summit',
    formType: '1099-NEC',
    label: '1099-NEC — Summit Advisory',
    topTab: '1099-necs',
    verifyDocKey: '1099-nec',
    subTabKey: 'summit',
    importReady: true,
  },
]

export function libraryDocsForFormType(formType: ReviewFormType): LibraryDocument[] {
  return DOCUMENT_LIBRARY.filter(d => d.formType === formType)
}
