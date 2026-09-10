import { openSourceDocumentById } from '../../lib/sourceDocPopoutNavigation'
import type { AiDiagnosticCategoryId } from './aiDiagnosticCategories'
import { AI_DIAGNOSTIC_CATEGORIES } from './aiDiagnosticCategories'
import type { ActivityDeepLink } from './activityTypes'
import { checkReturnFormToOutputId } from './outputFormNav'
import type { ContentView } from './CheckReturnNav'
import type { OutputFormId } from '../data-review/outputForms'

export type ActivityNavigationHandlers = {
  setContentView: (view: ContentView) => void
  setSelectedForm: (form: string | null) => void
  setOutputFormId: (formId: OutputFormId) => void
  handleSelectAiDiagnosticSub: (subNavId: string) => void
  handleSelectFederal: () => void
}

export function aiDiagnosticSubNavId(categoryId: AiDiagnosticCategoryId): string {
  const index = AI_DIAGNOSTIC_CATEGORIES.findIndex(category => category.id === categoryId)
  return index >= 0 ? `diagnostic-${index + 1}` : 'diagnostic-1'
}

export function navigateToActivityTarget(
  link: ActivityDeepLink,
  handlers: ActivityNavigationHandlers,
): void {
  switch (link.target) {
    case 'form': {
      const mapped = checkReturnFormToOutputId(link.formLabel)
      handlers.setSelectedForm(link.formLabel)
      if (mapped) {
        handlers.setOutputFormId(mapped)
        handlers.setContentView('form-output')
      }
      break
    }
    case 'ai-diagnostics':
      handlers.handleSelectAiDiagnosticSub(link.subNavId)
      break
    case 'federal-summary':
      handlers.handleSelectFederal()
      break
    case 'source-document':
      openSourceDocumentById(
        link.docId,
        link.detailFieldId,
        undefined,
        link.focus ?? (link.detailFieldId ? 'input' : 'document'),
      )
      break
    default:
      break
  }
}
