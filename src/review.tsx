import { ChangeEvent, DragEvent, ReactNode, useRef, useState } from 'react'
import { useRouter } from './router'
import { IdentityDocumentType, useReport } from './reportState'
import { MissingInfoNote, ProgressSteps, StepActionBar } from './report'
import { detailsPath, evidencePath, submissionPath } from './reportRoutes'
import { DEMO_OTP, ID_ALLOWED_MIME, ID_DOCUMENT_LABELS, ID_DOCUMENT_OPTIONS, ID_MAX_SIZE, INDIAN_STATES } from './identity'
import { SearchableSelect } from './searchableSelect'

function formatAmount(amount: number | null) {
  return amount != null ? `₹${amount.toLocaleString('en-IN')}` : 'Not provided yet'
}

function formatFileSize(bytes?: number) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function iconProps() {
  return { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
}

function ShieldGlyph() { return <svg {...iconProps()}><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" /></svg> }
function PhoneGlyph() { return <svg {...iconProps()}><path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z" /></svg> }
function RupeeGlyph() { return <svg {...iconProps()}><path d="M6 4h11M6 8h11M6 4c4.5 0 7 1.8 7 4.5S10.5 13 6 13l8 8" /></svg> }
function BankGlyph() { return <svg {...iconProps()}><path d="M3 10l9-6 9 6M4 10v9h16v-9M9 21v-7M15 21v-7M2 21h20" /></svg> }
function CardGlyph() { return <svg {...iconProps()}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg> }
function CalendarGlyph() { return <svg {...iconProps()}><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="3" y1="10" x2="21" y2="10" /></svg> }
function ReceiptGlyph() { return <svg {...iconProps()}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="9" y1="12" x2="15" y2="12" /></svg> }
function UserGlyph() { return <svg {...iconProps()}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg> }
function PinGlyph() { return <svg {...iconProps()}><path d="M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg> }
function FileGlyph() { return <svg {...iconProps()}><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><polyline points="13 3 13 8 18 8" /></svg> }
function TrashGlyph() { return <svg {...iconProps()}><polyline points="4 7 20 7" /><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M10 11v6M14 11v6M9 7V4h6v3" /></svg> }
function ShieldCheckGlyph() { return <svg {...iconProps()}><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg> }
function DigiLockerGlyph() { return <svg viewBox="-4 -4 64 60" aria-hidden="true">
  <path d="M32.56,18.75V0H15.2a3.35,3.35,0,0,0-3.34,3.34V48.5a3.35,3.35,0,0,0,3.34,3.34H52.58a3.35,3.35,0,0,0,3.34-3.34V18.75Z" fill="#6334fa" />
  <polygon points="35.14 16.59 55.92 16.59 35.14 0 35.14 16.59" fill="#6334fa" />
  <path d="M9,44.89a9,9,0,0,1-4.07-17,11.8,11.8,0,0,1,21.76-6A9.47,9.47,0,0,1,30,21.24a9.33,9.33,0,0,1,8.93,6.55,9,9,0,0,1,5,8.09,9,9,0,0,1-7.69,8.92v.09H9Z" fill="#6334fa" />
  <path d="M37.79,28.72a8.06,8.06,0,0,0-11.64-5.24A10.52,10.52,0,0,0,6.22,28.16c0,.17,0,.35,0,.52A7.72,7.72,0,0,0,9,43.6H34.94a7.72,7.72,0,0,0,2.85-14.88Z" fill="#fff" />
  <circle cx="19.91" cy="30.9" r="1.91" fill="#6334fa" />
  <polygon points="20.46 31.6 19.35 31.6 18.06 36.93 21.76 36.93 20.46 31.6" fill="#6334fa" />
</svg> }
function UploadGlyph() { return <svg {...iconProps()}><path d="M12 16V4" /><path d="M8 8l4-4 4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg> }

function VerifyIdentityChooser() {
  const { report, setReport } = useReport()
  const method = report.complainant.identityMethod
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [connecting, setConnecting] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [docType, setDocType] = useState<IdentityDocumentType | ''>('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectDigiLocker = () => {
    if (connecting) return
    setUploadOpen(false)
    setError(null)
    setConnecting(true)
    setTimeout(() => {
      setConnecting(false)
      setReport(current => ({
        ...current,
        complainant: {
          ...current.complainant,
          name: current.complainant.name || 'Priya Sharma',
          state: current.complainant.state || 'Maharashtra',
          identityMethod: 'digilocker',
          identityDocument: { type: 'aadhaar', issuer: 'UIDAI', fileName: null, fileSize: null, mimeType: null, uploaded: true, source: 'digilocker', status: 'demo-verified' },
        },
      }))
    }, 900)
  }

  const openUpload = () => {
    setError(null)
    setUploadOpen(true)
  }

  const acceptFile = (file: File) => {
    if (!docType) {
      setError('Choose a document type first.')
      return
    }
    if (!ID_ALLOWED_MIME.includes(file.type)) {
      setError('That file type isn’t supported. Please upload a JPG, JPEG or PNG.')
      return
    }
    if (file.size > ID_MAX_SIZE) {
      setError('That file is larger than 5MB. Please upload a smaller file.')
      return
    }
    setError(null)
    setReport(current => ({
      ...current,
      complainant: {
        ...current.complainant,
        identityMethod: 'manual-upload',
        identityDocument: { type: docType, issuer: null, fileName: file.name, fileSize: file.size, mimeType: file.type, uploaded: true, source: 'manual-upload', status: 'demo-verified' },
      },
    }))
  }

  const onFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) acceptFile(file)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) acceptFile(file)
  }

  return <div className="verify-identity">
    <p className="verify-identity-title">Verify your identity</p>
    <p className="helper">We need one identity document to identify the complainant.</p>

    <label className={`verify-option${method === 'digilocker' ? ' selected' : ''}`}>
      <input type="radio" name="verify-identity-method" checked={method === 'digilocker'} onChange={connectDigiLocker} />
      <span className="verify-option-icon digilocker"><DigiLockerGlyph /></span>
      <span className="verify-option-body">
        <span className="verify-option-title">Use DigiLocker</span>
        <span className="verify-option-sub">{connecting ? 'Connecting…' : 'Fetch a government-issued document securely'}</span>
      </span>
    </label>

    <label className={`verify-option${method === 'manual-upload' || uploadOpen ? ' selected' : ''}`}>
      <input type="radio" name="verify-identity-method" checked={method === 'manual-upload' || uploadOpen} onChange={openUpload} />
      <span className="verify-option-icon upload"><UploadGlyph /></span>
      <span className="verify-option-body">
        <span className="verify-option-title">Upload a document</span>
        <span className="verify-option-sub">JPG or PNG · Max 5MB</span>
      </span>
    </label>

    {uploadOpen && <div className="identity-upload-panel">
      <label className="identity-upload-type">Document type
        <select value={docType} onChange={e => setDocType(e.target.value as IdentityDocumentType)}>
          <option value="">Select a document type</option>
          {ID_DOCUMENT_OPTIONS.map(o => <option key={o.type} value={o.type}>{o.label}</option>)}
        </select>
      </label>
      <div
        className={`identity-dropzone${dragActive ? ' drag-active' : ''}`}
        onClick={() => docType && fileInputRef.current?.click()}
        onDragOver={event => { event.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <span className="identity-dropzone-icon" aria-hidden="true"><UploadGlyph /></span>
        <p>Drag and drop your document here or</p>
        <button type="button" className="button secondary" onClick={event => { event.stopPropagation(); fileInputRef.current?.click() }} disabled={!docType}>Choose file</button>
        <p className="identity-dropzone-hint">JPG or PNG · Max 5MB</p>
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" hidden onChange={onFileChosen} />
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>}

    <p className="verify-identity-note"><ShieldGlyph /> Documents are secure and only used for this report.</p>
  </div>
}

function ReviewField({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return <div className="review-field">
    <span className="review-field-icon">{icon}</span>
    <div className="review-field-body">
      <p className="review-field-label">{label}</p>
      <p className="review-field-value">{value}</p>
    </div>
  </div>
}

function SuspectReviewSection({ report, onEdit }: { report: ReturnType<typeof useReport>['report']; onEdit: () => void }) {
  const { suspect } = report
  const allRows: [string, string | null][] = [
    ['Mobile number', suspect.mobile],
    ['Email', suspect.email],
    ['Bank account', suspect.bankAccount],
    ['Address', suspect.address],
    ['Photograph', suspect.photograph],
    ['Other identifying document', suspect.otherDocument],
    ['Website / social media handle', suspect.websiteOrHandle],
  ]
  const rows = allRows.filter(([, value]) => !!value)

  if (rows.length === 0) return null

  return <section className="review-card">
    <div className="review-card-head">
      <h2>Optional suspect information</h2>
      <button type="button" className="link-button" onClick={onEdit}>Edit</button>
    </div>
    <dl className="review-fields">
      {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
  </section>
}

export function ReportReview() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()
  const category = report.category ?? 'financial-fraud'
  const isFinancial = category === 'financial-fraud'
  const isAccount = category === 'account-identity'
  const isOther = category === 'other-cyber'

  const editDetails = () => navigate(detailsPath(category))
  const editEvidence = () => navigate(evidencePath(category))
  const editIdentity = () => setReport(current => ({
    ...current,
    complainant: {
      ...current.complainant,
      identityMethod: null,
      identityConsent: { granted: false, purpose: null },
      identityDocument: { type: null, issuer: null, fileName: null, fileSize: null, mimeType: null, uploaded: false, source: null, status: 'not-provided' },
    },
  }))

  const removeEvidence = (id: string) => setReport(current => ({ ...current, evidence: current.evidence.filter(item => item.id !== id) }))

  const [editingDetails, setEditingDetails] = useState(false)
  const [name, setName] = useState(report.complainant.name ?? '')
  const [mobile, setMobile] = useState(report.complainant.mobile ?? '')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const mobileVerified = report.complainant.mobileVerified
  const mobileValid = /^\d{10}$/.test(mobile)

  const updateName = (value: string) => {
    setName(value)
    setReport(current => ({ ...current, complainant: { ...current.complainant, name: value.trim() ? value : null } }))
  }

  const updateState = (value: string) => {
    setReport(current => ({ ...current, complainant: { ...current.complainant, state: value || null } }))
  }

  const changeMobile = (value: string) => {
    setMobile(value)
    setOtpSent(false)
    setOtp('')
    setOtpError(null)
    setReport(current => ({ ...current, complainant: { ...current.complainant, mobile: value || null, mobileVerified: false } }))
  }

  const sendOtp = () => {
    if (!mobileValid) return
    setOtpSent(true)
    setOtpError(null)
    setOtp('')
  }

  const verifyOtp = () => {
    if (otp.trim() === DEMO_OTP) {
      setOtpError(null)
      setReport(current => ({ ...current, complainant: { ...current.complainant, mobile, mobileVerified: true } }))
    } else {
      setOtpError('Incorrect code. Please try again.')
    }
  }

  const typeLabel = isFinancial ? 'Incident type' : 'Issue'
  const typeValue = isAccount
    ? (report.accountIdentity.affectedType ?? 'Not provided yet')
    : isOther
      ? (report.otherIncident.issueType ?? 'Not provided yet')
      : (report.incident.type ?? 'Financial fraud')

  const whenText = [report.incident.date, report.incident.approximateTime].filter(Boolean).join(', ') || 'Not provided yet'

  const detailFields: [ReactNode, string, ReactNode][] = [
    [<ShieldGlyph />, typeLabel, typeValue],
  ]

  if (isFinancial) {
    detailFields.push(
      [<PhoneGlyph />, 'How were you contacted?', report.incident.contactMethod ?? 'Not provided yet'],
      [<RupeeGlyph />, 'Amount involved', formatAmount(report.incident.amount)],
      [<BankGlyph />, 'Claimed to represent', report.incident.impersonation ?? 'Not provided yet'],
      [<CardGlyph />, 'Payment method', report.incident.paymentMethod ?? 'Not provided yet'],
      [<BankGlyph />, 'Bank / wallet / merchant', report.transaction.merchantName ?? 'Not provided yet'],
      [<CalendarGlyph />, 'When did it happen?', whenText],
      [<ReceiptGlyph />, 'Transaction / UTR number', report.transaction.transactionId ?? 'Not provided yet'],
    )
  } else if (isAccount) {
    detailFields.push(
      [<CardGlyph />, 'Platform', report.accountIdentity.accountPlatform ?? 'Not provided yet'],
      [<ShieldCheckGlyph />, 'Access status', report.accountIdentity.accessStatus ?? 'Not provided yet'],
      [<PhoneGlyph />, 'How it was discovered', report.accountIdentity.misuseType ?? 'Not provided yet'],
      [<CalendarGlyph />, 'When did it happen?', whenText],
    )
  } else {
    detailFields.push(
      [<CardGlyph />, 'Platform', report.otherIncident.platform ?? 'Not provided yet'],
      [<PhoneGlyph />, 'Profile, account or link', report.otherIncident.personOrAccountIdentifier ?? 'Not provided yet'],
      [<CalendarGlyph />, 'When did it happen?', whenText],
    )
  }

  const docUploaded = report.complainant.identityDocument.uploaded
  const identityComplete = !!report.complainant.name && report.complainant.mobileVerified && !!report.complainant.state && docUploaded

  const submit = () => {
    if (!identityComplete) return
    navigate(submissionPath(category))
  }

  return <main className="report-page report-page-wide">
    <ProgressSteps current="Review" />
    <div className="report-intro">
      <h1>Review your report</h1>
      <p className="lead">Please review all the details before submitting.</p>
    </div>

    <div className="review-layout">
      <div className="review-main">
        <section className="review-card">
          <div className="review-card-head">
            <h2>Report details</h2>
            <button type="button" className="link-button" onClick={editDetails}>Edit</button>
          </div>
          <div className="review-grid">
            {detailFields.map(([icon, label, value]) => <ReviewField key={label} icon={icon} label={label} value={value} />)}
          </div>
          <p className="review-description">{report.incident.description || 'Not provided yet'}</p>
        </section>

        <section className="review-card">
          <div className="review-card-head">
            <h2>Evidence ({report.evidence.length})</h2>
            <button type="button" className="link-button" onClick={editEvidence}>Edit</button>
          </div>
          {report.evidence.length === 0
            ? <p className="review-description">No evidence added.</p>
            : <ul className="evidence-review-list">
                {report.evidence.map(item => {
                  const size = formatFileSize(item.size)
                  return <li key={item.id}>
                    <FileGlyph />
                    <div className="evidence-review-body">
                      <p className="evidence-review-name">{item.fileName ?? item.description ?? 'Evidence item'}</p>
                      {size && <p className="evidence-review-size">{size}</p>}
                    </div>
                    <button type="button" className="evidence-review-remove" onClick={() => removeEvidence(item.id)} aria-label="Remove evidence"><TrashGlyph /></button>
                  </li>
                })}
              </ul>}
        </section>

        <SuspectReviewSection report={report} onEdit={editEvidence} />

        <MissingInfoNote missing={report.missingInformation} onAddDetails={editDetails} />

        <p className="secure-banner"><ShieldCheckGlyph /> Your information is secure and will only be used for this report.</p>
      </div>

      <aside className="needed your-details-card">
        <div className="review-card-head">
          <h2>Your details</h2>
          <button type="button" className="link-button" onClick={() => setEditingDetails(value => !value)}>{editingDetails ? 'Done' : 'Edit'}</button>
        </div>
        <p className="helper">These details are used to identify you and send updates about your complaint.</p>

        <div className="your-details-rows">
          <div className="your-details-row">
            <span className="your-details-icon"><UserGlyph /></span>
            <span className="your-details-label">Name</span>
            <span className="your-details-value">
              {editingDetails
                ? <input id="complainant-name" className="review-field-input" value={name} onChange={event => updateName(event.target.value)} placeholder="As it appears on your ID document" />
                : (report.complainant.name ?? 'Not provided yet')}
            </span>
          </div>

          <div className="your-details-row">
            <span className="your-details-icon"><PhoneGlyph /></span>
            <span className="your-details-label">Mobile number</span>
            <span className="your-details-value">
              {editingDetails
                ? (mobileVerified
                    ? <>
                        <span>{mobile}</span>
                        <span className="verified-pill">✓ Verified</span>
                        <button type="button" className="link-button" onClick={() => changeMobile(mobile)}>Change</button>
                      </>
                    : <span className="mobile-edit-block">
                        <input
                          id="complainant-mobile"
                          className="review-field-input"
                          inputMode="numeric"
                          value={mobile}
                          onChange={event => changeMobile(event.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit mobile number"
                        />
                        {!otpSent
                          ? <button type="button" className="button secondary small" onClick={sendOtp} disabled={!mobileValid}>Send OTP</button>
                          : <span className="otp-inline">
                              <input inputMode="numeric" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" aria-label="OTP" />
                              <button type="button" className="button secondary small" onClick={verifyOtp} disabled={otp.trim().length !== 6}>Verify</button>
                            </span>}
                        {otpSent && <p className="helper otp-helper">Demo OTP flow — use <b>{DEMO_OTP}</b>.</p>}
                        {otpError && <p className="field-error">{otpError}</p>}
                      </span>)
                : <>
                    {report.complainant.mobile ?? 'Not provided yet'}
                    {mobileVerified && <span className="verified-pill">✓ Verified</span>}
                  </>}
            </span>
          </div>

          <div className="your-details-row">
            <span className="your-details-icon"><PinGlyph /></span>
            <span className="your-details-label">State / UT</span>
            <span className="your-details-value">
              {editingDetails
                ? <SearchableSelect value={report.complainant.state ?? ''} options={INDIAN_STATES} onChange={updateState} placeholder="Search for a state" />
                : (report.complainant.state ?? 'Not provided yet')}
            </span>
          </div>
        </div>

        <div className="your-details-row your-details-identity">
          <span className="your-details-icon"><FileGlyph /></span>
          <span className="your-details-label">Identity document</span>
          <span className="your-details-value">
            {docUploaded
              ? <span className="verified-note">✓ Added via {report.complainant.identityMethod === 'digilocker' ? 'DigiLocker' : 'upload'}</span>
              : 'Not added yet'}
          </span>
        </div>

        {docUploaded && report.complainant.identityMethod === 'digilocker' && <div className="digilocker-summary-card">
          <span className="digilocker-summary-badge"><span className="digilocker-summary-icon"><DigiLockerGlyph /></span> DigiLocker <span className="verified-pill">Verified</span></span>
          <p className="helper">Document fetched securely from DigiLocker</p>
          <p className="review-field-value">Document type: {ID_DOCUMENT_LABELS[report.complainant.identityDocument.type ?? ''] ?? 'Document'}</p>
          {report.complainant.identityDocument.issuer && <p className="review-field-value">Issuer: {report.complainant.identityDocument.issuer}</p>}
        </div>}
        {docUploaded && report.complainant.identityMethod !== 'digilocker' && <p className="review-field-value your-details-doc-type">{ID_DOCUMENT_LABELS[report.complainant.identityDocument.type ?? ''] ?? 'Document'}</p>}
        {docUploaded && <button type="button" className="link-button" onClick={editIdentity}>Change document</button>}

        <VerifyIdentityChooser />

        <details className="why-we-need-this">
          <summary>Why we need this</summary>
          <p className="helper">To identify the complainant and communicate with you about your report.</p>
        </details>
      </aside>
    </div>

    <StepActionBar
      onBack={editEvidence}
      primaryLabel="Confirm & submit"
      onPrimary={submit}
      primaryDisabled={!identityComplete}
      note="You can go back and edit any information if needed."
    />
  </main>
}
