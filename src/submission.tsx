import { useState } from 'react'
import { Link, useRouter } from './router'

const REFERENCE_NUMBER = 'NCRP-2026-0823-001247'

function iconProps() {
  return { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
}

function ShieldGlyph() {
  return <svg {...iconProps()}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>
}
function CopyGlyph() {
  return <svg {...iconProps()}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
}
function TrendingUpGlyph() {
  return <svg {...iconProps()}><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></svg>
}
function LockGlyph() {
  return <svg {...iconProps()}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
}
function BuildingGlyph() {
  return <svg {...iconProps()}><path d="M3 10l9-6 9 6" /><path d="M4 10v9h16v-9" /><line x1="9" y1="21" x2="9" y2="14" /><line x1="15" y1="21" x2="15" y2="14" /><line x1="2" y1="21" x2="22" y2="21" /></svg>
}
function HeadsetGlyph() {
  return <svg {...iconProps()}><path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M19 19v1a3 3 0 0 1-3 3h-3" /></svg>
}
function PhoneGlyph() {
  return <svg {...iconProps()}><path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z" /></svg>
}
function CoinGlyph() {
  return <svg {...iconProps()}><circle cx="12" cy="12" r="9" /><path d="M9.3 15c.4 1 1.5 1.6 2.7 1.6 1.7 0 3-1 3-2.3 0-1.1-.9-1.7-2.5-2.1l-1-.3c-1.5-.4-2.2-1-2.2-2 0-1.3 1.3-2.2 3-2.2 1.1 0 2.2.5 2.6 1.5" /><line x1="12" y1="6" x2="12" y2="7.6" /><line x1="12" y1="16.4" x2="12" y2="18" /></svg>
}
function PersonGlyph() {
  return <svg {...iconProps()}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
}
function SearchGlyph() {
  return <svg {...iconProps()}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.2" y2="16.2" /></svg>
}
const NEXT_STEPS = [
  { icon: BuildingGlyph, tone: 'blue', title: 'Sent to State/UT authority', text: 'Your complaint is sent to the State/UT law-enforcement agency responsible for handling it.' },
  { icon: CoinGlyph, tone: 'orange', title: 'Financial checks, if needed', text: 'Banks, payment providers and other organisations may be contacted to trace or stop the flow of funds.' },
  { icon: SearchGlyph, tone: 'purple', title: 'Complaint examined', text: 'The concerned authority will review your information and evidence and decides appropriate action as per law.' },
  { icon: PersonGlyph, tone: 'green', title: 'You may be contacted', text: 'If more information, documents or a statement is needed, the authority may contact you using your registered details.' },
]

export function ReportSubmission() {
  const { navigate } = useRouter()
  const [copied, setCopied] = useState(false)

  const copyReference = () => {
    navigator.clipboard?.writeText(REFERENCE_NUMBER).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const trackReport = () => navigate('/track')

  return <main className="report-page report-page-wide submission-page">
    <div className="submission-layout">
      <section className="submission-card submission-main">
        <img className="verify-success-badge" src="/assets/verify-success.png" alt="" aria-hidden="true" />
        <h1>Report submitted!</h1>
        <p className="submission-lead">Your report has been successfully submitted. It is now with the appropriate authority for further action.</p>

        <div className="submission-ref-block">
          <p className="submission-label">Your reference number</p>
          <div className="submission-ref-row">
            <span className="submission-ref-value">{REFERENCE_NUMBER}</span>
            <button type="button" className="submission-copy-btn" onClick={copyReference}><CopyGlyph /> {copied ? 'Copied' : 'Copy'}</button>
          </div>
          <p className="submission-ref-note"><ShieldGlyph /> Save this number to track your report and use it for any communication.</p>
        </div>

        <div className="submission-track-row">
          <span className="submission-track-icon"><TrendingUpGlyph /></span>
          <div><h3>Track your report</h3><p>Check the status of your report anytime using your reference number.</p></div>
        </div>
        <button type="button" className="button primary submission-track-btn" onClick={trackReport}>Track my report <span aria-hidden="true">→</span></button>
        <p className="submission-secure-note"><LockGlyph /> Your information is secure and encrypted.</p>
      </section>

      <section className="submission-card submission-next">
        <h2>What happens next?</h2>
        <p className="submission-sub">Here’s what will happen after your report is submitted.</p>
        <ul className="submission-next-list">
          {NEXT_STEPS.map(step => <li key={step.title}>
            <span className={`submission-next-icon tone-${step.tone}`}><step.icon /></span>
            <div><h3>{step.title}</h3><p>{step.text}</p></div>
          </li>)}
        </ul>
      </section>
    </div>

    <div className="submission-help-bar">
      <span className="submission-help-left"><HeadsetGlyph /> <span><b>Need help?</b><br />For immediate assistance on financial cyber fraud, call 1930.</span></span>
      <a className="button secondary submission-call-btn" href="tel:1930"><PhoneGlyph /> <span>Call 1930<br /><small>Financial cyber fraud</small></span></a>
    </div>

    <p className="submission-footer-note"><ShieldGlyph /> Your information is safe and secure with us. We follow strict security protocols to protect your data and privacy.</p>

    <Link className="submission-home-link" to="/">Return to homepage</Link>
  </main>
}
