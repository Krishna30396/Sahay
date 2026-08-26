import { ChangeEvent, useMemo, useRef, useState } from 'react'
import { useRouter } from './router'
import { EvidenceType, ReportCategory, SuspectInfo, useReport } from './reportState'
import type { EvidenceItem as EvidenceRecord } from './reportState'
import { MissingInfoNote, ProgressSteps, StepActionBar } from './report'
import { detailsPath, reviewPath } from './reportRoutes'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024

interface SectionConfig {
  type: EvidenceType
  title: string
  description: string
  actionLabel: string
  mode: 'file' | 'details'
}

const FINANCIAL_SECTIONS: SectionConfig[] = [
  { type: 'transaction', title: 'Payment or transaction', description: 'Payment receipt / transaction screenshot.', actionLabel: 'Add file', mode: 'file' },
  { type: 'conversation', title: 'Communication', description: 'WhatsApp, SMS, email or other messages.', actionLabel: 'Add file', mode: 'file' },
  { type: 'contact', title: 'Contact details', description: 'Phone number, UPI ID or account details used.', actionLabel: 'Add details', mode: 'details' },
  { type: 'website', title: 'Website / profile', description: 'Link or screenshot of the site or listing.', actionLabel: 'Add file', mode: 'file' },
  { type: 'other', title: 'Something else', description: 'Add another file or explain what it contains.', actionLabel: 'Add evidence', mode: 'file' },
]

const ACCOUNT_SECTIONS: SectionConfig[] = [
  { type: 'account-alert', title: 'Account or security alert', description: 'Security emails, login alerts or account notifications.', actionLabel: 'Add file', mode: 'file' },
  { type: 'conversation', title: 'Conversation or message', description: 'Messages showing impersonation, threats or unauthorized activity.', actionLabel: 'Add file', mode: 'file' },
  { type: 'profile', title: 'Profile or account', description: 'Screenshot of the affected or impersonating profile.', actionLabel: 'Add file', mode: 'file' },
  { type: 'identity-info', title: 'Identity-related information', description: 'Evidence showing how your personal information was used.', actionLabel: 'Add file', mode: 'file' },
  { type: 'other', title: 'Something else', description: 'Add another file or explain what it contains.', actionLabel: 'Add evidence', mode: 'file' },
]

const OTHER_SECTIONS_BASE: SectionConfig[] = [
  { type: 'conversation', title: 'Message or conversation', description: 'Chat, message or email related to the incident.', actionLabel: 'Add file', mode: 'file' },
  { type: 'profile', title: 'Profile / account', description: 'Screenshot of the profile or account involved.', actionLabel: 'Add file', mode: 'file' },
  { type: 'website', title: 'Website / link', description: 'Link or screenshot of the website involved.', actionLabel: 'Add file', mode: 'file' },
  { type: 'screenshot', title: 'Screenshot', description: 'Any other relevant screenshot.', actionLabel: 'Add file', mode: 'file' },
  { type: 'other', title: 'Something else', description: 'Add another file or explain what it contains.', actionLabel: 'Add evidence', mode: 'file' },
]

function moveToFront(list: SectionConfig[], type: EvidenceType): SectionConfig[] {
  const item = list.find(s => s.type === type)
  if (!item) return list
  return [item, ...list.filter(s => s.type !== type)]
}

function sectionsFor(category: ReportCategory, issueType: string | null): SectionConfig[] {
  if (category === 'account-identity') return ACCOUNT_SECTIONS
  if (category === 'other-cyber') {
    if (issueType === 'Fake profile or impersonation') return moveToFront(OTHER_SECTIONS_BASE, 'profile')
    if (issueType === 'Suspicious message, link or website') return moveToFront(OTHER_SECTIONS_BASE, 'website')
    return OTHER_SECTIONS_BASE
  }
  return FINANCIAL_SECTIONS
}

const CLASSIFY_LABELS: Record<EvidenceType, string> = {
  transaction: 'Payment / transaction',
  conversation: 'Conversation',
  contact: 'Phone / UPI details',
  website: 'Website / profile',
  other: 'Other',
  'account-alert': 'Account or security alert',
  profile: 'Profile or account',
  'identity-info': 'Identity-related information',
  screenshot: 'Screenshot',
}

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ev-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function suggestType(fileName: string, fallback: EvidenceType, available: EvidenceType[]): EvidenceType {
  const name = fileName.toLowerCase()
  const pick = (type: EvidenceType) => available.includes(type)
  if (pick('transaction') && /receipt|payment|txn|transaction|upi|paid|debit|credit/.test(name)) return 'transaction'
  if (pick('account-alert') && /alert|security|hacked|login/.test(name)) return 'account-alert'
  if (pick('conversation') && /chat|whatsapp|sms|message|mail/.test(name)) return 'conversation'
  if (pick('profile') && /profile|account/.test(name)) return 'profile'
  if (pick('website') && /site|web|profile|listing|url|link/.test(name)) return 'website'
  return fallback
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface PendingUpload {
  sectionType: EvidenceType
  file: File
  previewUrl: string
  suggestedType: EvidenceType
  selectedType: EvidenceType
  note: string
  status: 'loading' | 'confirming'
}

function EvidenceItem({ item, sectionTitles, onView, onReplace, onRemove }: {
  item: EvidenceRecord
  sectionTitles: Record<string, string>
  onView: () => void
  onReplace: () => void
  onRemove: () => void
}) {
  const isImage = item.mimeType?.startsWith('image/')
  const title = item.fileName ?? (item.description ? item.description.slice(0, 40) : 'Contact details')
  return <li className="evidence-card">
    <div className="evidence-thumb" aria-hidden="true">
      {isImage && item.previewUrl ? <img src={item.previewUrl} alt="" /> : <span className="file-icon">{item.fileName ? 'PDF' : 'i'}</span>}
    </div>
    <div className="evidence-meta">
      <p className="evidence-title">{title}</p>
      <p className="evidence-category">{sectionTitles[item.type] ?? item.type}{item.size ? ` · ${formatSize(item.size)}` : ''}</p>
    </div>
    <span className="added-state">✓ Added</span>
    <div className="evidence-actions">
      {item.previewUrl && <button type="button" onClick={onView}>View</button>}
      <button type="button" onClick={onReplace}>Replace</button>
      <button type="button" onClick={onRemove}>Remove</button>
    </div>
  </li>
}

function CategoryRow({ section, error, onPick, detailsOpen, onOpenDetails, onSaveDetails, onCancelDetails }: {
  section: SectionConfig
  error: string | null
  onPick: () => void
  detailsOpen: boolean
  onOpenDetails: () => void
  onSaveDetails: (text: string) => void
  onCancelDetails: () => void
}) {
  const [draft, setDraft] = useState('')
  return <div className="category-row">
    <div className="category-text">
      <h3>{section.title}</h3>
      <p>{section.description}</p>
      {error && <p className="field-error">{error}</p>}
      {detailsOpen && <form className="contact-form" onSubmit={e => { e.preventDefault(); onSaveDetails(draft); setDraft('') }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="e.g. UPI ID used by the caller" aria-label="Phone number, UPI ID or account details" autoFocus />
        <div className="category-actions">
          <button type="submit" className="button secondary" disabled={!draft.trim()}>Save</button>
          <button type="button" className="link-button" onClick={() => { setDraft(''); onCancelDetails() }}>Cancel</button>
        </div>
      </form>}
    </div>
    {!detailsOpen && <div className="category-actions">
      <button type="button" className="button secondary" onClick={section.mode === 'file' ? onPick : onOpenDetails}>{section.actionLabel}</button>
    </div>}
  </div>
}

function SuspectSection({ suspect, onChange }: { suspect: SuspectInfo; onChange: <K extends keyof SuspectInfo>(key: K, value: SuspectInfo[K]) => void }) {
  const hasAny = Object.values(suspect).some(v => !!v)
  const [open, setOpen] = useState(hasAny)

  if (!open) {
    return <section className="suspect-section">
      <h2>Do you know anything about the person involved?</h2>
      <button type="button" className="button secondary" onClick={() => setOpen(true)}>+ Add suspect information</button>
    </section>
  }

  return <section className="suspect-section">
    <h2>Do you know anything about the person involved?</h2>
    <p className="helper">Only add information you know. All of this is optional and will never block submission.</p>
    <div className="field-grid">
      <label>Suspect mobile number
        <input value={suspect.mobile ?? ''} onChange={e => onChange('mobile', e.target.value || null)} placeholder="Not provided" />
      </label>
      <label>Suspect email
        <input value={suspect.email ?? ''} onChange={e => onChange('email', e.target.value || null)} placeholder="Not provided" />
      </label>
      <label>Suspect bank account
        <input value={suspect.bankAccount ?? ''} onChange={e => onChange('bankAccount', e.target.value || null)} placeholder="Not provided" />
      </label>
      <label>Suspect address
        <input value={suspect.address ?? ''} onChange={e => onChange('address', e.target.value || null)} placeholder="Not provided" />
      </label>
      <label>Suspect photograph
        <input value={suspect.photograph ?? ''} onChange={e => onChange('photograph', e.target.value || null)} placeholder="Describe or reference a file you have" />
      </label>
      <label>Other identifying document
        <input value={suspect.otherDocument ?? ''} onChange={e => onChange('otherDocument', e.target.value || null)} placeholder="Describe or reference a file you have" />
      </label>
      <label>Suspected website / social media handle
        <input value={suspect.websiteOrHandle ?? ''} onChange={e => onChange('websiteOrHandle', e.target.value || null)} placeholder="Not provided" />
      </label>
    </div>
  </section>
}

export function ReportEvidence() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()
  const category = report.category ?? 'financial-fraud'
  const issueType = category === 'other-cyber' ? report.otherIncident.issueType : null

  const sections = useMemo(() => sectionsFor(category, issueType), [category, issueType])
  const sectionTitles = useMemo(() => Object.fromEntries(sections.map(s => [s.type, s.title])), [sections])
  const classifyOptions = useMemo(() => sections.map(s => ({ type: s.type, label: CLASSIFY_LABELS[s.type] ?? s.title })), [sections])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingSection, setUploadingSection] = useState<EvidenceType | null>(null)
  const [pending, setPending] = useState<PendingUpload | null>(null)
  const [errors, setErrors] = useState<Partial<Record<EvidenceType, string>>>({})
  const [openDetailsFor, setOpenDetailsFor] = useState<EvidenceType | null>(null)

  const pickFile = (type: EvidenceType) => {
    setUploadingSection(type)
    fileInputRef.current?.click()
  }

  const onFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    const sectionType = uploadingSection
    if (!file || !sectionType) return
    setErrors(current => ({ ...current, [sectionType]: undefined }))
    if (!ALLOWED_MIME.includes(file.type)) {
      setErrors(current => ({ ...current, [sectionType]: 'That file type isn’t supported. Please add a JPG, PNG or PDF.' }))
      return
    }
    if (file.size > MAX_SIZE) {
      setErrors(current => ({ ...current, [sectionType]: 'That file is larger than 10MB. Please add a smaller file.' }))
      return
    }
    try {
      const previewUrl = URL.createObjectURL(file)
      const suggestedType = suggestType(file.name, sectionType, sections.map(s => s.type))
      setPending({ sectionType, file, previewUrl, suggestedType, selectedType: suggestedType, note: '', status: 'loading' })
      setTimeout(() => setPending(current => (current && current.file === file ? { ...current, status: 'confirming' } : current)), 600)
    } catch {
      setErrors(current => ({ ...current, [sectionType]: 'Something went wrong while adding this file. Please try again.' }))
    }
  }

  const savePending = () => {
    if (!pending) return
    const item: EvidenceRecord = {
      id: makeId(),
      type: pending.selectedType,
      fileName: pending.file.name,
      mimeType: pending.file.type,
      size: pending.file.size,
      previewUrl: pending.previewUrl,
      description: pending.note.trim() || undefined,
      source: 'ai-suggested',
      confirmed: true,
    }
    setReport(current => ({ ...current, evidence: [...current.evidence, item] }))
    setPending(null)
  }

  const cancelPending = () => {
    if (pending) URL.revokeObjectURL(pending.previewUrl)
    setPending(null)
  }

  const saveDetails = (type: EvidenceType, text: string) => {
    const item: EvidenceRecord = { id: makeId(), type, description: text.trim(), source: 'user', confirmed: true }
    setReport(current => ({ ...current, evidence: [...current.evidence, item] }))
    setOpenDetailsFor(null)
  }

  const removeItem = (item: EvidenceRecord) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    setReport(current => ({ ...current, evidence: current.evidence.filter(i => i.id !== item.id) }))
  }

  const viewItem = (item: EvidenceRecord) => {
    if (item.previewUrl) window.open(item.previewUrl, '_blank', 'noopener')
  }

  const replaceItem = (item: EvidenceRecord) => {
    removeItem(item)
    const section = sections.find(s => s.type === item.type)
    if (section?.mode === 'details') setOpenDetailsFor(item.type)
    else pickFile(item.type)
  }

  const updateSuspect = <K extends keyof SuspectInfo>(key: K, value: SuspectInfo[K]) =>
    setReport(current => ({ ...current, suspect: { ...current.suspect, [key]: value } }))

  const hasEvidence = report.evidence.length > 0

  return <main className="report-page">
    <ProgressSteps current="Evidence" />
    <div className="report-intro">
      <h1>Add evidence</h1>
      <p className="lead">You don’t need every type of evidence. Add all relevant evidence you have.</p>
    </div>

    <section className="evidence-categories">
      {sections.map(section => <CategoryRow
        key={section.type}
        section={section}
        error={errors[section.type] ?? null}
        onPick={() => pickFile(section.type)}
        detailsOpen={openDetailsFor === section.type}
        onOpenDetails={() => setOpenDetailsFor(section.type)}
        onSaveDetails={text => saveDetails(section.type, text)}
        onCancelDetails={() => setOpenDetailsFor(null)}
      />)}
      <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" hidden onChange={onFileChosen} />
    </section>

    {pending && <section className="classify-panel">
      <div className="evidence-thumb" aria-hidden="true">
        {pending.file.type.startsWith('image/') ? <img src={pending.previewUrl} alt="" /> : <span className="file-icon">PDF</span>}
      </div>
      <div className="classify-body">
        <p className="evidence-title">{pending.file.name} <span className="evidence-category">· {formatSize(pending.file.size)}</span></p>
        {pending.status === 'loading'
          ? <p className="helper">Adding…</p>
          : <>
              <label htmlFor="classify-type">What does this show?</label>
              <select id="classify-type" value={pending.selectedType} onChange={e => setPending({ ...pending, selectedType: e.target.value as EvidenceType })}>
                {classifyOptions.map(o => <option key={o.type} value={o.type}>{o.label}</option>)}
              </select>
              <p className="helper">
                {pending.selectedType === pending.suggestedType ? 'Suggested by AI — please confirm.' : 'You changed the suggested category.'}
              </p>
              <div className="category-actions">
                <button type="button" className="button primary" onClick={savePending}>Save evidence</button>
                <button type="button" className="link-button" onClick={cancelPending}>Cancel</button>
              </div>
            </>}
      </div>
    </section>}

    {hasEvidence
      ? <ul className="evidence-list">
          {report.evidence.map(item => <EvidenceItem
            key={item.id}
            item={item}
            sectionTitles={sectionTitles}
            onView={() => viewItem(item)}
            onReplace={() => replaceItem(item)}
            onRemove={() => removeItem(item)}
          />)}
        </ul>
      : <p className="field-error">Add at least one piece of relevant evidence before continuing.</p>}

    <MissingInfoNote missing={report.missingInformation} onAddDetails={() => navigate(detailsPath(category))} />

    <SuspectSection suspect={report.suspect} onChange={updateSuspect} />

    <p className="safety-note">Use only information related to this incident. Do not upload passwords, OTPs, PINs or unrelated personal information.</p>

    <StepActionBar
      onBack={() => navigate(detailsPath(category))}
      primaryLabel="Continue to review"
      onPrimary={() => navigate(reviewPath(category))}
      primaryDisabled={!hasEvidence}
    />
  </main>
}
