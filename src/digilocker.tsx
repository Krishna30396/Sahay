import { useEffect, useRef, useState } from 'react'
import { useRouter } from './router'
import { IdentityDocumentType, useReport } from './reportState'
import { ProgressSteps, StepActionBar } from './report'
import { ID_DOCUMENT_LABELS } from './identity'
import { reviewPath } from './reportRoutes'

/**
 * Prototype-only mock of the DigiLocker Requester flow. A production build of this
 * feature would require Sahay to become an authorized DigiLocker Requester: complete
 * onboarding, obtain OAuth 2.0 / OpenID Connect credentials, register redirect URIs,
 * implement the real consent handshake, and securely handle the returned document
 * and access tokens. None of that is implemented here — every screen below is a
 * static, clearly-labelled simulation and no network call is made to DigiLocker.
 */

interface MockIssuedDocument {
  type: IdentityDocumentType
  issuer: string
}

const MOCK_DOCUMENTS: MockIssuedDocument[] = [
  { type: 'driving-license', issuer: 'Government of Telangana' },
  { type: 'aadhaar', issuer: 'UIDAI' },
]

export function DigiLockerTransition() {
  const { navigate } = useRouter()
  return <main className="report-page">
    <ProgressSteps current="Review / Submit" />
    <div className="report-intro">
      <h1>Continue to DigiLocker</h1>
      <p className="lead">DigiLocker will securely authenticate you and ask for your consent before sharing an identity document with Sahay.</p>
    </div>
    <section className="digilocker-panel">
      <div className="digilocker-architecture" aria-hidden="true">
        <span>Sahay</span>
        <span className="digilocker-arrow">↓</span>
        <span>DigiLocker</span>
        <span className="digilocker-arrow">↓</span>
        <span>Your consent</span>
        <span className="digilocker-arrow">↓</span>
        <span>Identity document</span>
        <span className="digilocker-arrow">↓</span>
        <span>Sahay</span>
      </div>
      <p className="eyebrow">PROTOTYPE INTEGRATION</p>
      <p className="helper">Live DigiLocker access is not connected in this demonstration.</p>
    </section>
    <StepActionBar
      onBack={() => navigate('/report/identity')}
      backLabel="Cancel"
      primaryLabel="Open DigiLocker demo"
      onPrimary={() => navigate('/report/identity/digilocker/consent')}
    />
  </main>
}

export function DigiLockerConsent() {
  const { navigate } = useRouter()
  const { setReport } = useReport()
  const [agreed, setAgreed] = useState(false)

  const allow = () => {
    if (!agreed) return
    setReport(current => ({
      ...current,
      complainant: { ...current.complainant, identityConsent: { granted: true, purpose: 'Identity confirmation for a cybercrime report' } },
    }))
    navigate('/report/identity/digilocker/documents')
  }

  return <main className="report-page">
    <ProgressSteps current="Review / Submit" />
    <section className="digilocker-panel digilocker-external">
      <p className="eyebrow">DIGILOCKER CONNECTION — PROTOTYPE</p>
      <h1>Share a document with Sahay</h1>
      <dl className="review-fields">
        <div><dt>Requester</dt><dd>Sahay — Cyber Fraud Assistance</dd></div>
        <div><dt>Purpose</dt><dd>Identity confirmation for a cybercrime report</dd></div>
      </dl>
      <p className="form-section-title">Requested information</p>
      <ul className="digilocker-consent-list">
        <li>✓ Name</li>
        <li>✓ Identity document</li>
        <li>✓ Document issuer</li>
        <li>✓ Document type</li>
      </ul>
      <p className="helper">You choose whether to share this information. Sahay only receives the information you consent to share.</p>
      <label className="digilocker-checkbox">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
        I agree to share the selected identity document with Sahay for this report.
      </label>
    </section>
    <StepActionBar
      onBack={() => navigate('/report/identity')}
      backLabel="Cancel"
      primaryLabel="Allow and continue"
      onPrimary={allow}
      primaryDisabled={!agreed}
    />
  </main>
}

export function DigiLockerDocuments() {
  const { navigate } = useRouter()
  const { setReport } = useReport()

  const select = (doc: MockIssuedDocument) => {
    setReport(current => ({
      ...current,
      complainant: {
        ...current.complainant,
        identityMethod: 'digilocker',
        identityDocument: { type: doc.type, issuer: doc.issuer, fileName: null, fileSize: null, mimeType: null, uploaded: false, source: 'digilocker', status: 'not-provided' },
      },
    }))
    navigate('/report/identity/digilocker/confirm')
  }

  return <main className="report-page">
    <ProgressSteps current="Review / Submit" />
    <div className="report-intro">
      <h1>Choose a document</h1>
      <p className="lead">Select one issued identity document to share.</p>
    </div>
    <section className="digilocker-panel digilocker-external">
      <p className="eyebrow">DIGILOCKER CONNECTION — PROTOTYPE</p>
      <div className="digilocker-doc-list">
        {MOCK_DOCUMENTS.map(doc => <div className="digilocker-doc-card" key={doc.type}>
          <h3>{ID_DOCUMENT_LABELS[doc.type]}</h3>
          <p className="helper">Issued by</p>
          <p>{doc.issuer}</p>
          <p className="verified-note">Issued document</p>
          <button type="button" className="button secondary" onClick={() => select(doc)}>Select</button>
        </div>)}
      </div>
    </section>
    <StepActionBar onBack={() => navigate('/report/identity/digilocker/consent')} backLabel="Cancel" />
  </main>
}

const TRANSFER_STEPS = ['Consent recorded', 'Document received', 'Document source confirmed']

export function DigiLockerConfirm() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()
  const [sharing, setSharing] = useState(false)
  const [stepsDone, setStepsDone] = useState(0)
  const finalizedRef = useRef(false)

  const docType = report.complainant.identityDocument.type
  const issuer = report.complainant.identityDocument.issuer

  useEffect(() => {
    if (!sharing) return
    if (stepsDone < TRANSFER_STEPS.length) {
      const timer = setTimeout(() => setStepsDone(n => n + 1), 500)
      return () => clearTimeout(timer)
    }
    if (finalizedRef.current) return
    finalizedRef.current = true
    setReport(current => ({
      ...current,
      complainant: { ...current.complainant, identityDocument: { ...current.complainant.identityDocument, uploaded: true, status: 'demo-verified' } },
    }))
    const timer = setTimeout(() => navigate('/report/identity/digilocker/success'), 500)
    return () => clearTimeout(timer)
    // setReport is intentionally excluded: ReportProvider hands out a new function identity on
    // every state update, and including it here re-triggers this effect mid-timer and drops the
    // scheduled navigation (guarded by finalizedRef, so the setReport call itself still only runs once).
  }, [sharing, stepsDone, navigate])

  if (!docType) {
    navigate('/report/identity/digilocker/documents')
    return null
  }

  return <main className="report-page">
    <ProgressSteps current="Review / Submit" />
    <div className="report-intro">
      <h1>Confirm document sharing</h1>
      <p className="lead">You are about to share this document with Sahay.</p>
    </div>
    <section className="digilocker-panel digilocker-external">
      <p className="eyebrow">DIGILOCKER CONNECTION — PROTOTYPE</p>
      <dl className="review-fields">
        <div><dt>Document</dt><dd>{ID_DOCUMENT_LABELS[docType]}</dd></div>
        <div><dt>Issued by</dt><dd>{issuer}</dd></div>
        <div><dt>Purpose</dt><dd>Identity confirmation for your cybercrime report</dd></div>
        <div><dt>Recipient</dt><dd>Sahay — Cyber Fraud Assistance</dd></div>
      </dl>

      {sharing && <div className="digilocker-transfer">
        <p className="helper">Securely sharing your document…</p>
        <ul className="digilocker-consent-list">
          {TRANSFER_STEPS.map((label, index) => <li key={label}>{index < stepsDone ? `✓ ${label}` : label}</li>)}
        </ul>
        <p className="helper future-note">Prototype verification — no real DigiLocker data was accessed.</p>
      </div>}
    </section>
    <StepActionBar
      onBack={() => navigate('/report/identity/digilocker/documents')}
      backLabel="Go back"
      primaryLabel={sharing ? 'Sharing…' : 'Confirm and share'}
      onPrimary={() => setSharing(true)}
      primaryDisabled={sharing}
    />
  </main>
}

export function DigiLockerSuccess() {
  const { navigate } = useRouter()
  const { report } = useReport()
  const docType = report.complainant.identityDocument.type
  const issuer = report.complainant.identityDocument.issuer

  return <main className="report-page">
    <ProgressSteps current="Review / Submit" />
    <div className="report-intro">
      <h1>Identity document received</h1>
      <p className="lead">Your identity document was provided through DigiLocker.</p>
    </div>
    <section className="review-summary">
      <dl className="review-fields">
        <div><dt>Document type</dt><dd>{docType ? ID_DOCUMENT_LABELS[docType] : 'Not provided yet'}</dd></div>
        <div><dt>Issuer</dt><dd>{issuer ?? 'Not provided yet'}</dd></div>
        <div><dt>Status</dt><dd>Demo verified</dd></div>
      </dl>
      <p className="helper">Only the information needed for this complaint should be retained.</p>
    </section>
    <StepActionBar onBack={() => navigate('/report/identity')} backLabel="← Back" primaryLabel="Continue to review" onPrimary={() => navigate(reviewPath(report.category))} />
  </main>
}
