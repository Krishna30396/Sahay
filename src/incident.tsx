import { createContext, ReactNode, useContext, useState } from 'react'

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

export interface IncidentData {
  incidentType: string
  amount: string
  currency: string
  date: string
  approximateTime: string
  paymentMethod: string
  transactionId: string
  contactMethod: string
  contactIdentifier: string
  suspectedImpersonation: boolean
  description: string
  timeline: string
  evidenceItems: EvidenceItem[]
  missingInformation: string[]
}

export function emptyIncident(): IncidentData {
  return {
    incidentType: 'money',
    amount: '',
    currency: 'INR',
    date: '',
    approximateTime: '',
    paymentMethod: '',
    transactionId: '',
    contactMethod: '',
    contactIdentifier: '',
    suspectedImpersonation: false,
    description: '',
    timeline: '',
    evidenceItems: [],
    missingInformation: [],
  }
}

type IncidentUpdater = IncidentData | ((current: IncidentData) => IncidentData)

interface IncidentContextValue {
  incident: IncidentData
  setIncident: (updater: IncidentUpdater) => void
}

const IncidentContext = createContext<IncidentContextValue | null>(null)

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [incident, setIncidentState] = useState<IncidentData>(emptyIncident)
  const setIncident = (updater: IncidentUpdater) =>
    setIncidentState(current => (typeof updater === 'function' ? (updater as (c: IncidentData) => IncidentData)(current) : updater))
  return <IncidentContext.Provider value={{ incident, setIncident }}>{children}</IncidentContext.Provider>
}

export function useIncident() {
  const ctx = useContext(IncidentContext)
  if (!ctx) throw new Error('useIncident must be used within IncidentProvider')
  return ctx
}
