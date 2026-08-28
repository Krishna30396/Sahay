import { ChangeEvent, DragEvent, ReactElement, useEffect, useMemo, useRef, useState } from 'react'
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
  mode: 'file' | 'details'
}

const FINANCIAL_SECTIONS: SectionConfig[] = [
  { type: 'transaction', title: 'Payment / transaction proof', description: 'Receipt, UTR, or bank / wallet transaction screenshot.', mode: 'file' },
  { type: 'conversation', title: 'Messages or screenshots', description: 'WhatsApp, SMS, email or other communication.', mode: 'file' },
  { type: 'contact', title: 'Phone / UPI details', description: 'Phone number, UPI ID or account details used by the caller.', mode: 'details' },
  { type: 'website', title: 'Website or social profile', description: 'Details of the website or profile involved, if applicable.', mode: 'file' },
  { type: 'other', title: 'Other evidence', description: 'Any other files that can support your report.', mode: 'file' },
]

const ACCOUNT_SECTIONS: SectionConfig[] = [
  { type: 'account-alert', title: 'Account or security alert', description: 'Security emails, login alerts or account notifications.', mode: 'file' },
  { type: 'conversation', title: 'Conversation or message', description: 'Messages showing impersonation, threats or unauthorized activity.', mode: 'file' },
  { type: 'profile', title: 'Profile or account', description: 'Screenshot of the affected or impersonating profile.', mode: 'file' },
  { type: 'identity-info', title: 'Identity-related information', description: 'Evidence showing how your personal information was used.', mode: 'file' },
  { type: 'other', title: 'Other evidence', description: 'Any other files that can support your report.', mode: 'file' },
]

const OTHER_SECTIONS_BASE: SectionConfig[] = [
  { type: 'conversation', title: 'Message or conversation', description: 'Chat, message or email related to the incident.', mode: 'file' },
  { type: 'profile', title: 'Profile / account', description: 'Screenshot of the profile or account involved.', mode: 'file' },
  { type: 'website', title: 'Website / link', description: 'Link or screenshot of the website involved.', mode: 'file' },
  { type: 'screenshot', title: 'Screenshot', description: 'Any other relevant screenshot.', mode: 'file' },
  { type: 'other', title: 'Other evidence', description: 'Any other files that can support your report.', mode: 'file' },
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

function iconProps() {
  return { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
}

function UploadCloudGlyph() {
  return <svg {...iconProps()}>
    <path d="M7.5 18a4.5 4.5 0 0 1-.9-8.91 5.5 5.5 0 0 1 10.62-1.94A4.5 4.5 0 0 1 16.5 18h-9z" />
    <path d="M12 12.5v6" />
    <path d="M9.3 15.2 12 12.5l2.7 2.7" />
  </svg>
}

function ReceiptGlyph() {
  return <svg {...iconProps()}>
    <path d="M6 3h12v18l-2.5-1.5L13 21l-1.5-1.5L10 21l-2.5-1.5L6 21V3z" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="12.5" y2="16" />
  </svg>
}

function ChatGlyph() {
  return <svg {...iconProps()}>
    <path d="M21 12a7.5 7.5 0 0 1-11.4 6.4L4 20l1.3-4.4A7.5 7.5 0 1 1 21 12z" />
  </svg>
}

function GlobeGlyph() {
  return <svg {...iconProps()}>
    <circle cx="12" cy="12" r="9" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" />
  </svg>
}

function FolderGlyph() {
  return <svg {...iconProps()}>
    <path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z" />
  </svg>
}

function AlertGlyph() {
  return <svg {...iconProps()}>
    <path d="M12 3 2 20h20L12 3z" />
    <line x1="12" y1="10" x2="12" y2="14.5" />
    <circle cx="12" cy="17.3" r="0.6" fill="currentColor" stroke="none" />
  </svg>
}

function ProfileGlyph() {
  return <svg {...iconProps()}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
}

function IdCardGlyph() {
  return <svg {...iconProps()}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="11" r="1.8" />
    <line x1="13.5" y1="9.5" x2="18" y2="9.5" />
    <line x1="13.5" y1="12.5" x2="18" y2="12.5" />
    <line x1="6" y1="15.5" x2="11" y2="15.5" />
  </svg>
}

function ImageGlyph() {
  return <svg {...iconProps()}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M4.5 17 9 12.5l3 3 3.5-4.5 4 6" />
  </svg>
}

function HeartGlyph() {
  return <svg {...iconProps()}>
    <path d="M12 20.5s-7.5-4.5-9.5-9A5 5 0 0 1 12 6.5 5 5 0 0 1 21.5 11.5c-2 4.5-9.5 9-9.5 9z" />
  </svg>
}

function TrashGlyph() {
  return <svg {...iconProps()}>
    <polyline points="4 7 20 7" />
    <path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
}

const SECTION_ICONS: Partial<Record<EvidenceType, () => ReactElement>> = {
  transaction: ReceiptGlyph,
  conversation: ChatGlyph,
  website: GlobeGlyph,
  other: FolderGlyph,
  'account-alert': AlertGlyph,
  profile: ProfileGlyph,
  'identity-info': IdCardGlyph,
  screenshot: ImageGlyph,
}

function HelpfulEvidenceSidebar({ sections }: { sections: SectionConfig[] }) {
  const fileSections = sections.filter(s => s.mode === 'file')
  return <aside className="needed helpful-evidence-card">
    <h2>Helpful evidence</h2>
    <p className="helper">Add whatever you have.</p>
    <ul className="helpful-evidence-list">
      {fileSections.map(section => {
        const Icon = SECTION_ICONS[section.type] ?? FolderGlyph
        return <li key={section.type} className="helpful-evidence-item">
          <span className="review-field-icon" aria-hidden="true"><Icon /></span>
          <div>
            <h4>{section.title}</h4>
            <p>{section.description}</p>
          </div>
        </li>
      })}
    </ul>
    <div className="helpful-evidence-footer">
      <HeartGlyph />
      <p><strong>Don’t have these?</strong> That’s okay. You can continue.</p>
    </div>
  </aside>
}

function EvidenceRow({ item, onView, onRemove }: {
  item: EvidenceRecord
  onView: () => void
  onRemove: () => void
}) {
  const isImage = item.mimeType?.startsWith('image/')
  const isPdf = item.mimeType === 'application/pdf'
  const title = item.fileName ?? (item.description ? item.description.slice(0, 40) : 'Contact details')
  return <li className="evidence-card">
    <div className={`evidence-thumb${isPdf ? ' evidence-thumb-pdf' : ''}`} aria-hidden="true">
      {isImage && item.previewUrl ? <img src={item.previewUrl} alt="" /> : <span className="file-icon">{isPdf ? 'PDF' : 'i'}</span>}
    </div>
    <div className="evidence-meta">
      <p className="evidence-title">{title}</p>
      <p className="evidence-category">{item.size ? `${formatSize(item.size)} · ` : ''}Added just now</p>
    </div>
    <div className="evidence-card-actions">
      {item.previewUrl && <button type="button" className="evidence-view-link" onClick={onView}>View</button>}
      <button type="button" className="evidence-remove-btn" onClick={onRemove} aria-label="Remove file"><TrashGlyph /></button>
    </div>
  </li>
}

function SuspectSection({ suspect, onChange }: { suspect: SuspectInfo; onChange: <K extends keyof SuspectInfo>(key: K, value: SuspectInfo[K]) => void }) {
  const hasAny = Object.values(suspect).some(v => !!v)
  const [open, setOpen] = useState(hasAny || window.location.hash === '#suspect')
  const firstFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) firstFieldRef.current?.focus()
  }, [open])

  if (!open) {
    return <section id="suspect" className="suspect-section">
      <h2>Do you know anything about the person involved?</h2>
      <button type="button" className="button secondary suspect-add-button" onClick={() => setOpen(true)}>
        <span className="suspect-add-icon"><ProfileGlyph /></span> Add suspect information
      </button>
    </section>
  }

  return <section id="suspect" className="suspect-section">
    <h2>Do you know anything about the person involved?</h2>
    <p className="helper">Only add information you know. All of this is optional and will never block submission.</p>
    <div className="field-grid">
      <label>Suspect mobile number
        <input ref={firstFieldRef} value={suspect.mobile ?? ''} onChange={e => onChange('mobile', e.target.value || null)} placeholder="Not provided" />
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
  const fileTypes = useMemo(() => sections.filter(s => s.mode === 'file').map(s => s.type), [sections])
  const detailsSection = useMemo(() => sections.find(s => s.mode === 'details') ?? null, [sections])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsDraft, setDetailsDraft] = useState('')

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    setError(null)
    for (const file of list) {
      if (!ALLOWED_MIME.includes(file.type)) {
        setError('That file type isn’t supported. Please add a JPG, PNG or PDF.')
        continue
      }
      if (file.size > MAX_SIZE) {
        setError('That file is larger than 10MB. Please add a smaller file.')
        continue
      }
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      const type = suggestType(file.name, fileTypes[0] ?? 'other', fileTypes)
      const item: EvidenceRecord = {
        id: makeId(),
        type,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        previewUrl,
        source: 'ai-suggested',
        confirmed: true,
      }
      setReport(current => ({ ...current, evidence: [...current.evidence, item] }))
    }
  }

  const onFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files)
    event.target.value = ''
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    if (event.dataTransfer.files) addFiles(event.dataTransfer.files)
  }

  const addDemoDocument = () => {
    const item: EvidenceRecord = {
      id: makeId(),
      type: fileTypes[0] ?? 'other',
      fileName: 'payment-screenshot-demo.png',
      mimeType: 'image/png',
      size: 248000,
      source: 'ai-suggested',
      confirmed: true,
    }
    setReport(current => ({ ...current, evidence: [...current.evidence, item] }))
  }

  const removeItem = (item: EvidenceRecord) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    setReport(current => ({ ...current, evidence: current.evidence.filter(i => i.id !== item.id) }))
  }

  const viewItem = (item: EvidenceRecord) => {
    if (item.previewUrl) window.open(item.previewUrl, '_blank', 'noopener')
  }

  const saveDetails = (text: string) => {
    if (!detailsSection || !text.trim()) return
    const item: EvidenceRecord = { id: makeId(), type: detailsSection.type, description: text.trim(), source: 'user', confirmed: true }
    setReport(current => ({ ...current, evidence: [...current.evidence, item] }))
    setDetailsDraft('')
    setDetailsOpen(false)
  }

  const updateSuspect = <K extends keyof SuspectInfo>(key: K, value: SuspectInfo[K]) =>
    setReport(current => ({ ...current, suspect: { ...current.suspect, [key]: value } }))

  const hasEvidence = report.evidence.length > 0

  return <main className="report-page report-page-wide">
    <ProgressSteps current="Evidence" />
    <div className="report-intro">
      <h1>Add evidence</h1>
      <p className="lead">Add any files that help support your report. You can continue even if you don’t have all of them.</p>
    </div>

    <div className="evidence-layout">
      <div className="evidence-main">
        <div
          className={`evidence-dropzone${dragActive ? ' drag-active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={event => { event.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
        >
          <span className="evidence-dropzone-icon" aria-hidden="true"><UploadCloudGlyph /></span>
          <h3>Upload files</h3>
          <p>Drag and drop files here or</p>
          <button type="button" className="button secondary" onClick={event => { event.stopPropagation(); fileInputRef.current?.click() }}>Choose files</button>
          <p className="evidence-dropzone-hint">Screenshots, PDFs, JPG, PNG · Max 10MB per file</p>
          <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" hidden onChange={onFileChosen} />
        </div>
        <button type="button" className="demo-fill-btn" onClick={addDemoDocument}>✨ Add a demo document</button>

        {error && <p className="field-error">{error}</p>}

        {detailsSection && (detailsOpen
          ? <form className="contact-form evidence-details-form" onSubmit={e => { e.preventDefault(); saveDetails(detailsDraft) }}>
              <label htmlFor="evidence-details-input">{detailsSection.title}</label>
              <input id="evidence-details-input" value={detailsDraft} onChange={e => setDetailsDraft(e.target.value)} placeholder={detailsSection.description} autoFocus />
              <div className="category-actions">
                <button type="submit" className="button secondary" disabled={!detailsDraft.trim()}>Save</button>
                <button type="button" className="link-button" onClick={() => { setDetailsDraft(''); setDetailsOpen(false) }}>Cancel</button>
              </div>
            </form>
          : <button type="button" className="link-button evidence-details-toggle" onClick={() => setDetailsOpen(true)}>+ Add {detailsSection.title.toLowerCase()} instead</button>)}

        {hasEvidence
          ? <section className="uploaded-files">
              <h3 className="uploaded-files-title">Uploaded files ({report.evidence.length})</h3>
              <ul className="evidence-list">
                {report.evidence.map(item => <EvidenceRow
                  key={item.id}
                  item={item}
                  onView={() => viewItem(item)}
                  onRemove={() => removeItem(item)}
                />)}
              </ul>
              <button type="button" className="link-button add-another-file" onClick={() => fileInputRef.current?.click()}>+ Add another file</button>
            </section>
          : <p className="field-error">Add at least one piece of relevant evidence before continuing.</p>}

        <MissingInfoNote missing={report.missingInformation} onAddDetails={() => navigate(detailsPath(category))} />

        <SuspectSection suspect={report.suspect} onChange={updateSuspect} />
      </div>

      <HelpfulEvidenceSidebar sections={sections} />
    </div>

    <p className="safety-note">Use only information related to this incident. Do not upload passwords, OTPs, PINs or unrelated personal information.</p>

    <StepActionBar
      onBack={() => navigate(detailsPath(category))}
      backLabel="← Back to details"
      primaryLabel="Continue to review"
      onPrimary={() => navigate(reviewPath(category))}
      primaryDisabled={!hasEvidence}
      note="Your files are only used for this report."
    />
  </main>
}
