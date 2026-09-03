import { PopOut } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'

interface ViewSourceDocumentsButtonProps {
  onClick?: () => void
  className?: string
}

export default function ViewSourceDocumentsButton({
  onClick,
  className,
}: ViewSourceDocumentsButtonProps) {
  if (!onClick) return null

  return (
    <Button
      priority="secondary"
      purpose="passive"
      size="small"
      className={className}
      onClick={onClick}
      automationId="view-source-documents-cta"
    >
      <PopOut size="small" aria-hidden />
      View source documents
    </Button>
  )
}
