import { ReportCategory } from './reportState'

function base(category: ReportCategory | null | undefined) {
  if (category === 'account-identity') return '/report/account-identity'
  if (category === 'other-cyber') return '/report/other'
  return '/report'
}

export function startPath(category: ReportCategory | null | undefined) {
  return assistedPath(category)
}

export function assistedPath(category: ReportCategory | null | undefined) {
  return `${base(category)}/assisted`
}

export function assistedReviewPath(category: ReportCategory | null | undefined) {
  return `${base(category)}/assisted/review`
}

export function manualPath(category: ReportCategory | null | undefined) {
  return `${base(category)}/manual`
}

export function detailsPath(category: ReportCategory | null | undefined) {
  return `${base(category)}/details`
}

export function evidencePath(category: ReportCategory | null | undefined) {
  return `${base(category)}/evidence`
}

export function reviewPath(category: ReportCategory | null | undefined) {
  return `${base(category)}/review`
}

export function submissionPath(category: ReportCategory | null | undefined) {
  if (!category || category === 'financial-fraud') return '/report/submission'
  return `${base(category)}/submitted`
}

export function statusPath(category: ReportCategory | null | undefined) {
  return `${base(category)}/status`
}
