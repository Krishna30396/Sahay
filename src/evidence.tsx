import { ChangeEvent, useRef, useState } from 'react'
import { useRouter } from './router'
import { EvidenceType, useIncident } from './incident'
import type { EvidenceItem as EvidenceRecord } from './incident'
import { MISSING_LABELS, ProgressSteps } from './report'

const Arrow = () => <span aria-hidden="true">→</span>

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024

interface SectionConfig {
  type: EvidenceType
  title: string
  description: string
  actionLabel: string
  mode: 'file' | 'details'
}

const SECTIONS: SectionConfig[] = [
  { type: 'transaction', title: 'Payment or transaction', description: 'Payment receipt / transaction screenshot. Shows the amount, date and transaction details.', actionLabel: 'Add file', mode: 'file' },
  { type: 'conversation', title: 'Communication', description: 'WhatsApp, SMS, email or other messages related to the incident.', actionLabel: 'Add file', mode: 'file' },
  { type: 'contact', title: 'Contact details', description: 'Phone number, UPI ID or account details the person or service used.', actionLabel: 'Add details', mode: 'details' },
  { type: 'website', title: 'Website / profile', description: 'Link or screenshot of the website, profile or listing involved.', actionLabel: 'Add file', mode: 'file' },
  { type: 'other', title: 'Something else', description: 'Add another file or explain what it contains.', actionLabel: 'Add evidence', mode: 'file' },
]

const SECTION_TITLES: Record<EvidenceType, string> = Object.fromEntries(SECTIONS.map(s => [s.type, s.title])) as Record<EvidenceType, string>

const CLASSIFY_OPTIONS: { type: EvidenceType; label: string }[] = [
  { type: 'transaction', label: 'Payment / transaction' },
  { type: 'conversation', label: 'Conversation' },
  { type: 'contact', label: 'Phone / UPI details' },
  { type: 'website', label: 'Website / profile' },
  { type: 'other', label: 'Other' },
]

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ev-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function suggestType(fileName: string, fallback: EvidenceType): EvidenceType {
  const name = fileName.toLowerCase()
  if (/receipt|payment|txn|transaction|upi|paid|debit|credit/.test(name)) return 'transaction'
  if (/chat|whatsapp|sms|message|mail/.test(name)) return 'conversation'
  if (/site|web|profile|listing|url|link/.test(name)) return 'website'
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

function EvidenceItem({ item, onView, onReplace, onRemove }: {
  item: EvidenceRecord
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
      <p className="evidence-category">{SECTION_TITLES[item.type]}{item.size ? ` · ${formatSize(item.size)}` : ''}</p>
      <span className="added-state">✓ Added</span>
    </div>
    <div className="evidence-actions">
      {item.previewUrl && <button type="button" onClick={onView}>View</button>}
      <button type="button" onClick={onReplace}>Replace</button>
      <button type="button" onClick={onRemove}>Remove</button>
    </div>
  </li>
}

function EvidenceSection({ section, error, dismissed, onPick, onDismiss, onUndoDismiss, detailsOpen, onOpenDetails, onSaveDetails, onCancelDetails }: {
  section: SectionConfig
  error: string | null
  dismissed: boolean
  onPick: () => void
  onDismiss: () => void
  onUndoDismiss: () => void
  detailsOpen: boolean
  onOpenDetails: () => void
  onSaveDetails: (text: string) => void
  onCancelDetails: () => void
}) {
  const [draft, setDraft] = useState('')
  return <article className="category-card">
    <h3>{section.title}</h3>
    <p>{section.description}</p>
    {error && <p className="field-error">{error}</p>}
    {dismissed
      ? <p className="skipped-note">Marked as not available. <button type="button" className="link-button" onClick={onUndoDismiss}>Add anyway</button></p>
      : section.mode === 'file'
        ? <div className="category-actions">
            <button type="button" className="button secondary" onClick={onPick}>{section.actionLabel}</button>
            <button type="button" className="link-button" onClick={onDismiss}>I don’t have this information</button>
          </div>
        : detailsOpen
          ? <form className="contact-form" onSubmit={e => { e.preventDefault(); onSaveDetails(draft); setDraft('') }}>
              <label htmlFor="contact-evidence">Phone number, UPI ID or account details</label>
              <input id="contact-evidence" value={draft} onChange={e => setDraft(e.target.value)} placeholder="e.g. UPI ID used by the caller" />
              <div className="category-actions">
                <button type="submit" className="button secondary" disabled={!draft.trim()}>Save</button>
                <button type="button" className="link-button" onClick={() => { setDraft(''); onCancelDetails() }}>Cancel</button>
              </div>
            </form>
          : <div className="category-actions">
              <button type="button" className="button secondary" onClick={onOpenDetails}>{section.actionLabel}</button>
              <button type="button" className="link-button" onClick={onDismiss}>I don’t have this information</button>
            </div>}
  </article>
}

export function ReportEvidence() {
  const { navigate } = useRouter()
  const { incident, setIncident } = useIncident()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingSection, setUploadingSection] = useState<EvidenceType | null>(null)
  const [pending, setPending] = useState<PendingUpload | null>(null)
  const [errors, setErrors] = useState<Partial<Record<EvidenceType, string>>>({})
  const [dismissed, setDismissed] = useState<Set<EvidenceType>>(new Set())
  const [openDetailsFor, setOpenDetailsFor] = useState<EvidenceType | null>(null)
  const [continued, setContinued] = useState(false)

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
      const suggestedType = suggestType(file.name, sectionType)
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
    setIncident(current => ({ ...current, evidenceItems: [...current.evidenceItems, item] }))
    dismissed.delete(pending.selectedType)
    setDismissed(new Set(dismissed))
    setPending(null)
  }

  const cancelPending = () => {
    if (pending) URL.revokeObjectURL(pending.previewUrl)
    setPending(null)
  }

  const saveDetails = (type: EvidenceType, text: string) => {
    const item: EvidenceRecord = { id: makeId(), type, description: text.trim(), source: 'user', confirmed: true }
    setIncident(current => ({ ...current, evidenceItems: [...current.evidenceItems, item] }))
    setOpenDetailsFor(null)
  }

  const removeItem = (item: EvidenceRecord) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    setIncident(current => ({ ...current, evidenceItems: current.evidenceItems.filter(i => i.id !== item.id) }))
  }

  const viewItem = (item: EvidenceRecord) => {
    if (item.previewUrl) window.open(item.previewUrl, '_blank', 'noopener')
  }

  const replaceItem = (item: EvidenceRecord) => {
    removeItem(item)
    const section = SECTIONS.find(s => s.type === item.type)
    if (section?.mode === 'details') setOpenDetailsFor(item.type)
    else pickFile(item.type)
  }

  const missingNotes: string[] = []
  incident.missingInformation.forEach(key => missingNotes.push(`We couldn’t detect the ${MISSING_LABELS[key] ?? key}.`))
  if (!incident.transactionId) missingNotes.push('Transaction ID hasn’t been added.')

  return <main className="report-page container">
    <ProgressSteps current="Evidence" />
    <div className="report-intro">
      <h1>Add evidence</h1>
      <p className="lead">Add anything that can help explain what happened.</p>
      <p className="reassurance">Screenshots, payment confirmations, messages and other information can help. You don’t need to have everything.</p>
    </div>

    <section className="needed">
      <h2>Evidence that may help</h2>
      <p className="helper">You can continue without all of these.</p>
      <div className="category-grid">
        {SECTIONS.map(section => <EvidenceSection
          key={section.type}
          section={section}
          error={errors[section.type] ?? null}
          dismissed={dismissed.has(section.type)}
          onPick={() => pickFile(section.type)}
          onDismiss={() => setDismissed(new Set(dismissed).add(section.type))}
          onUndoDismiss={() => { const next = new Set(dismissed); next.delete(section.type); setDismissed(next) }}
          detailsOpen={openDetailsFor === section.type}
          onOpenDetails={() => setOpenDetailsFor(section.type)}
          onSaveDetails={text => saveDetails(section.type, text)}
          onCancelDetails={() => setOpenDetailsFor(null)}
        />)}
      </div>
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
                {CLASSIFY_OPTIONS.map(o => <option key={o.type} value={o.type}>{o.label}</option>)}
              </select>
              <p className="helper">
                {pending.selectedType === pending.suggestedType ? 'Suggested by AI — please confirm.' : 'You changed the suggested category.'}
              </p>
              <label htmlFor="classify-note">Add a short note (optional)</label>
              <input id="classify-note" value={pending.note} onChange={e => setPending({ ...pending, note: e.target.value })} placeholder="Anything that helps explain this file" />
              <div className="category-actions">
                <button type="button" className="button primary" onClick={savePending}>Save evidence</button>
                <button type="button" className="link-button" onClick={cancelPending}>Cancel</button>
              </div>
            </>}
      </div>
    </section>}

    <section className="needed">
      <h2>Added evidence</h2>
      {incident.evidenceItems.length === 0
        ? <div className="empty-state">
            <p><b>No evidence added yet</b></p>
            <p className="helper">Add any screenshots, transaction details or messages that may help explain the incident.</p>
          </div>
        : <ul className="evidence-list">
            {incident.evidenceItems.map(item => <EvidenceItem
              key={item.id}
              item={item}
              onView={() => viewItem(item)}
              onReplace={() => replaceItem(item)}
              onRemove={() => removeItem(item)}
            />)}
          </ul>}
    </section>

    {missingNotes.length > 0 && <section className="needed">
      <h2>Missing information</h2>
      <ul className="missing-list">{missingNotes.map(note => <li key={note}>{note}</li>)}</ul>
      <p className="helper">You can continue without it.</p>
    </section>}

    <p className="safety-note">Use only information related to this incident. Do not upload passwords, OTPs, PINs or unrelated personal information.</p>
    <p className="helper">Files stay within this demo and are not sent to a government system.</p>

    <div className="placeholder-actions">
      <button className="button secondary" type="button" onClick={() => navigate('/report/assisted/review')}>← Back</button>
      {!continued
        ? <button className="button primary" type="button" onClick={() => setContinued(true)}>Continue to review <Arrow /></button>
        : <p className="confirmation">Evidence saved. The review screen isn’t built yet in this prototype.</p>}
    </div>
  </main>
}
