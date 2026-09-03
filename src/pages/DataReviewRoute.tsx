import { Navigate, useSearchParams } from 'react-router-dom'
import { resolveDataReviewRedirect } from '../lib/prototypeRoutes'
import DataReviewPage from './DataReviewPage'

/** Gate legacy `/data-review` — only the Phase 2 diagnostics demo stays on the combined page. */
export default function DataReviewRoute() {
  const [searchParams] = useSearchParams()
  const redirect = resolveDataReviewRedirect(searchParams.toString())
  if (redirect) {
    return <Navigate to={redirect} replace />
  }
  return <DataReviewPage />
}
