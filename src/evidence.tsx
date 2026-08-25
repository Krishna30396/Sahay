import { ChangeEvent, useRef, useState } from 'react'
import { useRouter } from './router'
import { EvidenceType, missingInformationLabel, useReport } from './reportState'
import type { EvidenceItem as EvidenceRecord } from './reportState'
import { ProgressSteps, StepActionBar } from './report'

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
  { type: 'transaction', title: 'Payment or transaction', description: 'Payment receipt / transaction screenshot.', actionLabel: 'Add file', mode: 'file' },
  { type: 'conversation', title: 'Communication', description: 'WhatsApp, SMS, email or other messages.', actionLabel: 'Add file', mode: 'file' },
  { type: 'contact', title: 'Contact details', description: 'Phone number, UPI ID or account details used.', actionLabel: 'Add details', mode: 'details' },
  { type: 'website', title: 'Website / profile', description: 'Link or screenshot of the site or listing.', actionLabel: 'Add file', mode: 'file' },
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
    </div>
    <span className="added-state">✓ Added</span>
    <div className="evidence-actions">
      {item.previewUrl && <button type="button" onClick={onView}>View</button>}
      <button type="button" onClick={onReplace}>Replace</button>
      <button type="button" onClick={onRemove}>Remove</button>
    </div>
  </li>
}

function CategoryRow({ section, error, dismissed, onPick, onDismiss, onUndoDismiss, detailsOpen, onOpenDetails, onSaveDetails, onCancelDetails }: {
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
      {dismissed
        ? <p className="skipped-note">Not available. <button type="button" className="link-button" onClick={onUndoDismiss}>Add anyway</button></p>
        : <>
            <button type="button" className="button secondary" onClick={section.mode === 'file' ? onPick : onOpenDetails}>{section.actionLabel}</button>
            <button type="button" className="link-button" onClick={onDismiss}>Don’t have this</button>
          </>}
    </div>}
  </div>
}

export function ReportEvidence() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingSection, setUploadingSection] = useState<EvidenceType | null>(null)
  const [pending, setPending] = useState<PendingUpload | null>(null)
  const [errors, setErrors] = useState<Partial<Record<EvidenceType, string>>>({})
  const [dismissed, setDismissed] = useState<Set<EvidenceType>>(new Set())
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
    setReport(current => ({ ...current, evidence: [...current.evidence, item] }))
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
    const section = SECTIONS.find(s => s.type === item.type)
    if (section?.mode === 'details') setOpenDetailsFor(item.type)
    else pickFile(item.type)
  }

  return <main className="report-page">
    <ProgressSteps current="Evidence" />
    <div className="report-intro">
      <h1>Add evidence</h1>
      <p className="lead">Add anything that can help explain what happened. You don’t need to have everything.</p>
    </div>

    <section className="evidence-categories">
      {SECTIONS.map(section => <CategoryRow
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
              <div className="category-actions">
                <button type="button" className="button primary" onClick={savePending}>Save evidence</button>
                <button type="button" className="link-button" onClick={cancelPending}>Cancel</button>
              </div>
            </>}
      </div>
    </section>}

    {report.evidence.length > 0
      ? <ul className="evidence-list">
          {report.evidence.map(item => <EvidenceItem
            key={item.id}
            item={item}
            onView={() => viewItem(item)}
            onReplace={() => replaceItem(item)}
            onRemove={() => removeItem(item)}
          />)}
        </ul>
      : <p className="helper">No evidence added yet.</p>}

    {report.missingInformation.length > 0 && <p className="helper">
      You can still continue. Missing: {report.missingInformation.map(missingInformationLabel).join(', ')}.
    </p>}

    <p className="safety-note">Use only information related to this incident. Do not upload passwords, OTPs, PINs or unrelated personal information.</p>

    <StepActionBar
      onBack={() => navigate('/report/details')}
      primaryLabel="Continue to review"
      onPrimary={() => navigate('/report/review')}
    />
  </main>
}
