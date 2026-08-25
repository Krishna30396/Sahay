import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

export type EvidenceType = 'transaction' | 'conversation' | 'contact' | 'website' | 'other'

export interface EvidenceItem {
  id: string
  type: EvidenceType
  fileName?: string
  mimeType?: string
  size?: number
  previewUrl?: string
  description?: string
  source?: 'user' | 'ai-suggested'
  confirmed?: boolean
}

export interface ReportIncident {
  type: string | null
  amount: number | null
  currency: 'INR'
  paymentMethod: string | null
  date: string | null
  approximateTime: string | null
  contactMethod: string | null
  impersonation: boolean | null
  description: string
}

export interface ReportState {
  entryMode: 'assisted' | 'manual' | null
  incident: ReportIncident
  transaction: { transactionId: string | null }
  evidence: EvidenceItem[]
  missingInformation: string[]
}

export function emptyReportState(): ReportState {
  return {
    entryMode: null,
    incident: {
      type: null,
      amount: null,
      currency: 'INR',
      paymentMethod: null,
      date: null,
      approximateTime: null,
      contactMethod: null,
      impersonation: null,
      description: '',
    },
    transaction: { transactionId: null },
    evidence: [],
    missingInformation: [],
  }
}

const MISSING_LABELS: Record<string, string> = {
  amount: 'Amount involved',
  paymentMethod: 'Payment method',
  date: 'Date',
  approximateTime: 'Approximate time',
  contactMethod: 'How you were contacted',
  transactionId: 'Transaction ID',
}

export function missingInformationLabel(key: string) {
  return MISSING_LABELS[key] ?? key
}

export function deriveMissingInformation(state: Pick<ReportState, 'incident' | 'transaction'>): string[] {
  const missing: string[] = []
  if (!state.incident.amount) missing.push('amount')
  if (!state.incident.paymentMethod) missing.push('paymentMethod')
  if (!state.incident.date) missing.push('date')
  if (!state.incident.approximateTime) missing.push('approximateTime')
  if (!state.incident.contactMethod) missing.push('contactMethod')
  if (!state.transaction.transactionId) missing.push('transactionId')
  return missing
}

type ReportUpdater = ReportState | ((current: ReportState) => ReportState)

interface ReportContextValue {
  report: ReportState
  setReport: (updater: ReportUpdater) => void
}

const ReportContext = createContext<ReportContextValue | null>(null)

export function ReportProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReportState>(emptyReportState)
  const setReport = (updater: ReportUpdater) =>
    setState(current => (typeof updater === 'function' ? (updater as (c: ReportState) => ReportState)(current) : updater))
  const report = useMemo<ReportState>(() => ({ ...state, missingInformation: deriveMissingInformation(state) }), [state])
  return <ReportContext.Provider value={{ report, setReport }}>{children}</ReportContext.Provider>
}

export function useReport() {
  const ctx = useContext(ReportContext)
  if (!ctx) throw new Error('useReport must be used within ReportProvider')
  return ctx
}
