import { ChangeEvent, useState } from 'react'
import { useRouter } from './router'
import { IdentityDocumentType, useReport } from './reportState'
import { ProgressSteps, StepActionBar } from './report'
import { reviewPath } from './reportRoutes'
import { SearchableSelect } from './searchableSelect'

export const DEMO_OTP = '123456'
export const ID_ALLOWED_MIME = ['image/jpeg', 'image/png']
export const ID_MAX_SIZE = 5 * 1024 * 1024

export const ID_DOCUMENT_OPTIONS: { type: IdentityDocumentType; label: string }[] = [
  { type: 'aadhaar', label: 'Aadhaar Card' },
  { type: 'pan', label: 'PAN Card' },
  { type: 'driving-license', label: 'Driving Licence' },
  { type: 'voter-id', label: 'Voter ID' },
  { type: 'passport', label: 'Passport' },
]

export const ID_DOCUMENT_LABELS: Record<string, string> = Object.fromEntries(ID_DOCUMENT_OPTIONS.map(o => [o.type, o.label]))

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
].sort((a, b) => a.localeCompare(b))

export function ConfirmYourDetails() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()

  const [name, setName] = useState(report.complainant.name ?? '')
  const [mobile, setMobile] = useState(report.complainant.mobile ?? '')
  const [state, setState] = useState(report.complainant.state ?? '')
  const [mobileVerified, setMobileVerified] = useState(report.complainant.mobileVerified)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)

  const mobileValid = /^\d{10}$/.test(mobile)
  const docUploaded = report.complainant.identityDocument.uploaded

  const updateName = (value: string) => {
    setName(value)
    setReport(current => ({ ...current, complainant: { ...current.complainant, name: value.trim() ? value : null } }))
  }

  const updateState = (value: string) => {
    setState(value)
    setReport(current => ({ ...current, complainant: { ...current.complainant, state: value || null } }))
  }

  const sendOtp = () => {
    if (!mobileValid) return
    setOtpSent(true)
    setOtpError(null)
    setOtp('')
  }

  const verifyOtp = () => {
    if (otp.trim() === DEMO_OTP) {
      setMobileVerified(true)
      setOtpError(null)
      setReport(current => ({ ...current, complainant: { ...current.complainant, mobile, mobileVerified: true } }))
    } else {
      setOtpError('Incorrect code. Please try again.')
    }
  }

  const changeMobile = (value: string) => {
    setMobile(value)
    setMobileVerified(false)
    setOtpSent(false)
    setOtp('')
    setOtpError(null)
  }

  const changeDocument = () => {
    setReport(current => ({
      ...current,
      complainant: {
        ...current.complainant,
        identityMethod: null,
        identityConsent: { granted: false, purpose: null },
        identityDocument: { type: null, issuer: null, fileName: null, fileSize: null, mimeType: null, uploaded: false, source: null, status: 'not-provided' },
      },
    }))
  }

  const canContinue = name.trim().length > 0 && mobileVerified && state.trim().length > 0 && docUploaded

  const submit = () => {
    if (!canContinue) return
    setReport(current => ({
      ...current,
      complainant: { ...current.complainant, name: name.trim(), mobile, mobileVerified: true, state },
    }))
    navigate(reviewPath(report.category))
  }

  return <main className="report-page">
    <ProgressSteps current="Review" />
    <div className="report-intro">
      <h1>Confirm your details</h1>
      <p className="lead">These details identify you as the person filing this report.</p>
    </div>

    <form className="review-form" onSubmit={event => event.preventDefault()}>
      <h2 className="form-section-title">Your details</h2>
      <div className="field-grid">
        <label>Full name <span className="required-badge">Required</span>
          <input value={name} onChange={e => updateName(e.target.value)} placeholder="As it appears on your ID document" />
        </label>
        <label>State / location <span className="required-badge">Required</span>
          <SearchableSelect value={state} options={INDIAN_STATES} onChange={updateState} placeholder="Search for a state" />
        </label>
      </div>

      <div className="field-grid">
        <label>Mobile number <span className="required-badge">Required</span>
          <input
            inputMode="numeric"
            value={mobile}
            onChange={e => changeMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile number"
            disabled={mobileVerified}
          />
        </label>
      </div>

      {mobileVerified
        ? <p className="verified-note">✓ Mobile number verified</p>
        : <div className="otp-flow">
            {!otpSent
              ? <button type="button" className="button secondary" onClick={sendOtp} disabled={!mobileValid}>Send OTP</button>
              : <>
                  <p className="helper">This is a mock OTP flow for the demo — use <b>{DEMO_OTP}</b>.</p>
                  <div className="otp-actions">
                    <input inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" aria-label="OTP" />
                    <button type="button" className="button secondary" onClick={verifyOtp} disabled={otp.trim().length !== 6}>Verify mobile number</button>
                  </div>
                  {otpError && <p className="field-error">{otpError}</p>}
                </>}
          </div>}
      <p className="helper">Mobile verification confirms who is filing this report. It is not your identity document.</p>

      <h2 className="form-section-title">Identity document</h2>

      {docUploaded
        ? <div className="identity-doc-added">
            <p className="verified-note">✓ Identity document added</p>
            <p className="helper">
              {ID_DOCUMENT_LABELS[report.complainant.identityDocument.type ?? ''] ?? 'Document'}
              {report.complainant.identityMethod === 'digilocker' ? ' — provided through DigiLocker' : ' — uploaded manually'}
            </p>
            <button type="button" className="link-button" onClick={changeDocument}>Change</button>
          </div>
        : <IdentityDocumentChoice onDigiLocker={() => navigate('/report/identity/digilocker')} onUpload={() => navigate('/report/identity/upload')} />}
    </form>

    <StepActionBar
      onBack={() => navigate(reviewPath(report.category))}
      backLabel="← Back to review"
      primaryLabel="Save and return to review"
      onPrimary={submit}
      primaryDisabled={!canContinue}
    />
  </main>
}

function IdentityDocumentChoice({ onDigiLocker, onUpload }: { onDigiLocker: () => void; onUpload: () => void }) {
  return <div className="identity-choice">
    <p className="lead">How would you like to provide your identity document?</p>
    <p className="helper">Choose the easiest option. Your document is shared only with your consent.</p>
    <div className="identity-choice-grid">
      <div className="identity-choice-card recommended">
        <span className="required-badge recommended-badge">Recommended</span>
        <h3>Continue with DigiLocker</h3>
        <p>Securely share an issued identity document from your DigiLocker account.</p>
        <p className="helper">You'll be taken to DigiLocker to sign in and choose what you want to share.</p>
        <button type="button" className="button primary" onClick={onDigiLocker}>Continue with DigiLocker <span aria-hidden="true">→</span></button>
        <p className="helper trust-note">Your consent is required before a document is shared.</p>
      </div>
      <div className="identity-choice-card">
        <h3>Upload an identity document</h3>
        <p>Upload one accepted national ID document as a JPG, JPEG or PNG.</p>
        <button type="button" className="button secondary" onClick={onUpload}>Upload ID</button>
        <p className="helper">Aadhaar, PAN, Driving Licence, Voter ID or Passport. Maximum 5 MB. You only need one document.</p>
      </div>
    </div>
  </div>
}

export function IdentityDocumentUpload() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()
  const [docType, setDocType] = useState<IdentityDocumentType | ''>(report.complainant.identityDocument.type ?? '')
  const [docFileName, setDocFileName] = useState(report.complainant.identityDocument.fileName)
  const [docUploaded, setDocUploaded] = useState(report.complainant.identityDocument.uploaded)
  const [docError, setDocError] = useState<string | null>(null)

  const onFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !docType) return
    setDocError(null)
    if (!ID_ALLOWED_MIME.includes(file.type)) {
      setDocError('That file type isn’t supported. Please upload a JPG, JPEG or PNG.')
      return
    }
    if (file.size > ID_MAX_SIZE) {
      setDocError('That file is larger than 5MB. Please upload a smaller file.')
      return
    }
    setDocFileName(file.name)
    setDocUploaded(true)
    setReport(current => ({
      ...current,
      complainant: {
        ...current.complainant,
        identityMethod: 'manual-upload',
        identityDocument: { type: docType, issuer: null, fileName: file.name, fileSize: file.size, mimeType: file.type, uploaded: true, source: 'manual-upload', status: 'demo-verified' },
      },
    }))
  }

  const removeDocument = () => {
    setDocFileName(null)
    setDocUploaded(false)
    setReport(current => ({
      ...current,
      complainant: {
        ...current.complainant,
        identityMethod: null,
        identityDocument: { type: docType || null, issuer: null, fileName: null, fileSize: null, mimeType: null, uploaded: false, source: null, status: 'not-provided' },
      },
    }))
  }

  return <main className="report-page">
    <ProgressSteps current="Review" />
    <div className="report-intro">
      <h1>Upload an identity document</h1>
      <p className="lead">Upload one accepted national ID document as a JPG, JPEG or PNG.</p>
    </div>
    <form className="review-form" onSubmit={event => event.preventDefault()}>
      <div className="field-grid">
        <label>Document type <span className="required-badge">Required</span>
          <select value={docType} onChange={e => setDocType(e.target.value as IdentityDocumentType)} disabled={docUploaded}>
            <option value="">Select a document type</option>
            {ID_DOCUMENT_OPTIONS.map(o => <option key={o.type} value={o.type}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {docUploaded
        ? <div className="identity-doc-added">
            <p className="verified-note">✓ Identity document added</p>
            <p className="helper">{docFileName} — Demo document accepted</p>
            <button type="button" className="link-button" onClick={removeDocument}>Remove</button>
          </div>
        : <>
            <label className="button secondary upload-button">
              Upload identity document
              <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" hidden onChange={onFileChosen} disabled={!docType} />
            </label>
            <p className="helper">JPG, JPEG or PNG. Maximum 5 MB. You only need one document.</p>
            {docError && <p className="field-error">{docError}</p>}
          </>}

      <p className="helper future-note">Actual document verification would occur through the connected official service. This prototype accepts the file as a demonstration only — no real verification is performed.</p>
    </form>
    <StepActionBar
      onBack={() => navigate('/report/identity')}
      primaryLabel="Save and return"
      onPrimary={() => navigate('/report/identity')}
      primaryDisabled={!docUploaded}
    />
  </main>
}
