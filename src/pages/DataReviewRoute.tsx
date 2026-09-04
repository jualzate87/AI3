import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  openReviewReturnPopout,
  OUTPUT_REVIEW_PATH,
  resolveDataReviewRedirect,
} from '../lib/prototypeRoutes'
import DataReviewPage from './DataReviewPage'

/** Gate legacy `/data-review` — only the Phase 2 diagnostics demo stays on the combined page. */
export default function DataReviewRoute() {
  const [searchParams] = useSearchParams()
  const redirect = resolveDataReviewRedirect(searchParams.toString())

  useEffect(() => {
    if (redirect === OUTPUT_REVIEW_PATH) {
      openReviewReturnPopout('1040')
    }
  }, [redirect])

  if (redirect === OUTPUT_REVIEW_PATH) {
    return <Navigate to="/smart-return?role=reviewer" replace />
  }

  if (redirect) {
    return <Navigate to={redirect} replace />
  }

  return <DataReviewPage />
}
