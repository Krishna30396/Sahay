import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

// Shared demo credential used throughout the prototype wherever a mobile number is
// pre-filled, displayed, or verified — kept consistent across the whole flow.
export const DEMO_MOBILE = '9876543210'

export type EvidenceType =
  | 'transaction' | 'conversation' | 'contact' | 'website' | 'other'
  | 'account-alert' | 'profile' | 'identity-info' | 'screenshot'

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
  subType: string | null
  amount: number | null
  currency: 'INR'
  paymentMethod: string | null
  date: string | null
  approximateTime: string | null
  contactMethod: string | null
  impersonation: string | null
  description: string
}

export interface AccountIdentityInfo {
  affectedType: string | null
  accessStatus: string | null
  accountPlatform: string | null
  misuseType: string | null
  accountRecovered: boolean | null
}

export interface OtherIncidentInfo {
  issueType: string | null
  platform: string | null
  personOrAccountIdentifier: string | null
  immediateRisk: string | null
}

export type ReportCategory = 'financial-fraud' | 'account-identity' | 'other-cyber'

export type IdentityDocumentType = 'aadhaar' | 'pan' | 'driving-license' | 'voter-id' | 'passport'

export type IdentitySource = 'digilocker' | 'manual-upload'

export interface IdentityDocument {
  type: IdentityDocumentType | null
  issuer: string | null
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  uploaded: boolean
  source: IdentitySource | null
  status: 'not-provided' | 'demo-verified' | null
}

export interface ComplainantInfo {
  name: string | null
  mobile: string | null
  mobileVerified: boolean
  state: string | null
  identityMethod: IdentitySource | null
  identityDocument: IdentityDocument
  identityConsent: { granted: boolean; purpose: string | null }
}

export interface SuspectInfo {
  mobile: string | null
  email: string | null
  bankAccount: string | null
  address: string | null
  photograph: string | null
  otherDocument: string | null
  websiteOrHandle: string | null
}

export interface ReportState {
  id: string
  category: ReportCategory | null
  entryMode: 'assisted' | 'manual' | null
  incident: ReportIncident
  accountIdentity: AccountIdentityInfo
  otherIncident: OtherIncidentInfo
  transaction: { transactionId: string | null; merchantName: string | null; transactionDate: string | null }
  evidence: EvidenceItem[]
  complainant: ComplainantInfo
  suspect: SuspectInfo
  missingInformation: string[]
  status: { stage: string; createdAt: string; lastUpdated: string }
}

function makeReportId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `report-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function emptyReportState(): ReportState {
  const now = new Date().toISOString()
  return {
    id: makeReportId(),
    category: null,
    entryMode: null,
    incident: {
      type: null,
      subType: null,
      amount: null,
      currency: 'INR',
      paymentMethod: null,
      date: null,
      approximateTime: null,
      contactMethod: null,
      impersonation: null,
      description: '',
    },
    accountIdentity: {
      affectedType: null,
      accessStatus: null,
      accountPlatform: null,
      misuseType: null,
      accountRecovered: null,
    },
    otherIncident: {
      issueType: null,
      platform: null,
      personOrAccountIdentifier: null,
      immediateRisk: null,
    },
    transaction: { transactionId: null, merchantName: null, transactionDate: null },
    evidence: [],
    complainant: {
      name: null,
      mobile: null,
      mobileVerified: false,
      state: null,
      identityMethod: null,
      identityDocument: { type: null, issuer: null, fileName: null, fileSize: null, mimeType: null, uploaded: false, source: null, status: 'not-provided' },
      identityConsent: { granted: false, purpose: null },
    },
    suspect: {
      mobile: null,
      email: null,
      bankAccount: null,
      address: null,
      photograph: null,
      otherDocument: null,
      websiteOrHandle: null,
    },
    missingInformation: [],
    status: { stage: 'draft', createdAt: now, lastUpdated: now },
  }
}

const MISSING_LABELS: Record<string, string> = {
  amount: 'Amount involved',
  paymentMethod: 'Payment method',
  date: 'Date',
  approximateTime: 'Approximate time',
  contactMethod: 'How you were contacted',
  transactionId: 'Transaction ID',
  accountPlatform: 'Platform',
  accessStatus: 'Access status',
  misuseType: 'Additional detail',
  otherPlatform: 'Platform',
  identifier: 'Profile, account or link',
}

export function missingInformationLabel(key: string) {
  return MISSING_LABELS[key] ?? key
}

type DerivableState = Pick<ReportState, 'incident' | 'transaction' | 'category' | 'accountIdentity' | 'otherIncident'>

function deriveFinancialMissing(state: DerivableState): string[] {
  const missing: string[] = []
  if (!state.incident.paymentMethod) missing.push('paymentMethod')
  if (!state.incident.date) missing.push('date')
  if (!state.incident.approximateTime) missing.push('approximateTime')
  if (!state.incident.contactMethod) missing.push('contactMethod')
  return missing
}

function deriveAccountIdentityMissing(state: DerivableState): string[] {
  const missing: string[] = []
  if (!state.accountIdentity.accountPlatform) missing.push('accountPlatform')
  if (!state.incident.date) missing.push('date')
  if (!state.incident.approximateTime) missing.push('approximateTime')
  if (state.accountIdentity.affectedType === 'Hacked account' || state.accountIdentity.affectedType === 'Someone accessed my account without permission') {
    if (!state.accountIdentity.accessStatus) missing.push('accessStatus')
  }
  if (state.accountIdentity.affectedType && state.accountIdentity.affectedType !== 'Something else' && !state.accountIdentity.misuseType) {
    missing.push('misuseType')
  }
  return missing
}

function deriveOtherMissing(state: DerivableState): string[] {
  const missing: string[] = []
  if (!state.otherIncident.platform) missing.push('otherPlatform')
  if (!state.incident.date) missing.push('date')
  if (!state.otherIncident.personOrAccountIdentifier) missing.push('identifier')
  return missing
}

export function deriveMissingInformation(state: DerivableState): string[] {
  if (state.category === 'account-identity') return deriveAccountIdentityMissing(state)
  if (state.category === 'other-cyber') return deriveOtherMissing(state)
  return deriveFinancialMissing(state)
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
