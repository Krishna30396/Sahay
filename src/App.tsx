import { KeyboardEvent, ReactElement, useEffect, useRef, useState } from 'react'
import { Link, RouterProvider, useRouter } from './router'
import { DEMO_MOBILE, ReportProvider, useReport } from './reportState'
import { NotFound, ReportAssisted, ReportManualEntry } from './report'
import { ReportDetails } from './details'
import { ReportEvidence } from './evidence'
import { ReportReview } from './review'
import { ReportSubmission } from './submission'
import { ReportStatus } from './status'
import { TrackReport } from './track'
import { ConfirmYourDetails, IdentityDocumentUpload } from './identity'
import { DigiLockerConfirm, DigiLockerConsent, DigiLockerDocuments, DigiLockerSuccess, DigiLockerTransition } from './digilocker'
import { AccountIdentityAssisted, AccountIdentityAssistedReview, AccountIdentityManual } from './accountIdentity'
import { OtherAssisted, OtherAssistedReview, OtherManual } from './otherCyber'

type ModalKind = 'steps' | 'info' | 'verify-mobile' | null

const Arrow = () => <span aria-hidden="true">→</span>

function HeroArtwork() {
  return <div className="hero-art" aria-hidden="true"><img src="/assets/hero-illustration.png" alt="" /></div>
}

function CardIllustration({ type }: { type: 'money' | 'identity' | 'other' }) {
  const images = { money: '/assets/money-fraud.png', identity: '/assets/identity-misuse.png', other: '/assets/other-cyber-issue.png' }
  return <div className="card-art" aria-hidden="true"><img src={images[type]} alt="" /></div>
}

function iconProps() {
  return { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
}

function MessageIcon() {
  return <svg {...iconProps()}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></svg>
}
function FolderIcon() {
  return <svg {...iconProps()}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
}
function SearchIcon() {
  return <svg {...iconProps()}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function CircleCheckIcon() {
  return <svg {...iconProps()}><circle cx="12" cy="12" r="9" /><polyline points="8.5 12.5 11 15 15.5 9" /></svg>
}
function ShieldBoltIcon() {
  return <svg {...iconProps()}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><polyline points="13 8 10 13 13 13 11 17" /></svg>
}
function HeadsetIcon() {
  return <svg {...iconProps()}><path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M19 19v1a3 3 0 0 1-3 3h-3" /></svg>
}
function BookmarkGlyph() {
  return <svg {...iconProps()}><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>
}
function FileTextGlyph() {
  return <svg {...iconProps()}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 3 14 8 19 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>
}
function PencilGlyph() {
  return <svg {...iconProps()}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
}
function ShieldCheckGlyph() {
  return <svg {...iconProps()}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
}
function ClockGlyph() {
  return <svg {...iconProps()}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
}
function WarningTriangleIcon() {
  return <svg {...iconProps()}><path d="M12 3.5l9.5 16.5H2.5z" /><line x1="12" y1="9.5" x2="12" y2="13.5" /><circle cx="12" cy="16.6" r=".9" fill="currentColor" stroke="none" /></svg>
}
const ACT_NOW_STEPS: { image: string; title: string; description: string }[] = [
  { image: '/assets/act-call.png', title: 'Call 1930', description: 'If money was just transferred, contact the financial-cyber-fraud helpline immediately.' },
  { image: '/assets/act-bank.png', title: 'Contact your bank or payment provider', description: 'Ask about securing the transaction.' },
  { image: '/assets/act-evidence.png', title: 'Preserve evidence', description: 'Keep messages, payment references and screenshots.' },
  { image: '/assets/act-report.png', title: 'Report the incident', description: 'Use this prototype to understand the reporting journey.' },
]

const NEXT_STEPS: { icon: () => ReactElement; label: string }[] = [
  { icon: MessageIcon, label: 'Tell us what happened' },
  { icon: FileTextGlyph, label: 'Check the details' },
  { icon: FolderIcon, label: 'Add relevant evidence' },
  { icon: SearchIcon, label: 'Review / Submit when ready' },
]

function NextSteps() {
  return <section className="next-steps container">
    <div className="next-steps-card">
      <p className="next-steps-title">What happens next</p>
      <div className="next-steps-row">
        {NEXT_STEPS.map((step, index) => {
          const Icon = step.icon
          const [firstWord, ...restWords] = step.label.split(' ')
          return <div className="next-step" key={step.label}>
            <span className="next-step-icon"><Icon /></span>
            <p><span className="next-step-num" aria-hidden="true">{index + 1}</span> <strong>{firstWord}</strong> {restWords.join(' ')}</p>
          </div>
        })}
      </div>
      <p className="next-steps-note"><CircleCheckIcon /> You’ll see everything before anything is submitted.</p>
    </div>
  </section>
}

function VerifyMobilePanel({ onVerified }: { onVerified: () => void }) {
  const { report, setReport } = useReport()
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone')
  const [mobile, setMobile] = useState(report.complainant.mobile || DEMO_MOBILE)
  const [sending, setSending] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpRound, setOtpRound] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const mobileValid = /^\d{10}$/.test(mobile)
  const otpValid = otp.every(digit => digit !== '')

  useEffect(() => {
    if (step !== 'success') return
    if (countdown <= 0) { onVerified(); return }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [step, countdown, onVerified])

  // Demo credential: auto-fill a random 6-digit OTP immediately on arriving on this
  // step, one digit at a time, so the flow is visibly a demo — the user still has to
  // press "Verify mobile" themselves to continue.
  useEffect(() => {
    if (step !== 'otp' || otpRound === 0) return
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const demoOtp = Array.from({ length: 6 }, () => String(Math.floor(Math.random() * 10)))
    demoOtp.forEach((digit, index) => {
      timers.push(setTimeout(() => {
        if (cancelled) return
        setOtp(current => {
          const next = [...current]
          next[index] = digit
          return next
        })
      }, index * 120))
    })
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [step, otpRound])

  const sendOtp = () => {
    if (!mobileValid || sending) return
    setSending(true)
    setReport(current => ({ ...current, complainant: { ...current.complainant, mobile } }))
    setTimeout(() => {
      setSending(false)
      setOtp(['', '', '', '', '', ''])
      setStep('otp')
      setOtpRound(round => round + 1)
      setTimeout(() => otpRefs.current[0]?.focus(), 0)
    }, 500)
  }

  const verifyOtp = () => {
    if (!otpValid || verifying) return
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      setReport(current => ({ ...current, complainant: { ...current.complainant, mobile, mobileVerified: true } }))
      setCountdown(3)
      setStep('success')
    }, 500)
  }

  const setOtpDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    setOtp(current => {
      const next = [...current]
      next[index] = digit
      return next
    })
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const onOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const maskedMobile = mobile.length === 10 ? `${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile

  return <div className="verify-modal">
    <div className="verify-art-panel">
      <img className="verify-art" src="/assets/verify-mobile.png" alt="" aria-hidden="true" />
      <h2 id="modal-title">Before you start,<br />we need to verify.</h2>
      <div className="verify-divider" aria-hidden="true"><span><ShieldCheckGlyph /></span></div>
      <p>It helps us keep your report connected to you so you can get the right help.</p>
    </div>
    <div className="verify-form-panel">
      {step === 'phone' && <>
        <h3>Verify your mobile number</h3>
        <p className="modal-sub">Enter your mobile number and we’ll send you a 6-digit OTP.</p>
        <div className="verify-phone-row">
          <span className="verify-country-code">+91 <span aria-hidden="true">⌄</span></span>
          <input
            inputMode="numeric"
            value={mobile}
            onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Enter mobile number"
            aria-label="Mobile number"
          />
        </div>
        <button type="button" className="button primary verify-send-btn" onClick={sendOtp} disabled={!mobileValid || sending}>
          {sending ? 'Sending…' : 'Send OTP'} <span aria-hidden="true">→</span>
        </button>
        <ul className="verify-benefits">
          <li><span className="verify-benefit-icon"><BookmarkGlyph /></span>We’ll use it to save your progress.</li>
          <li><span className="verify-benefit-icon"><FileTextGlyph /></span>Your number is used for this report.</li>
          <li><span className="verify-benefit-icon"><PencilGlyph /></span>You can change your number later.</li>
        </ul>
      </>}
      {step === 'otp' && <>
        <h3 className="verify-title-otp">Enter your verification code</h3>
        <p className="modal-sub verify-otp-sub">We sent a 6-digit code to<br /><b className="verify-otp-number">+91 {maskedMobile}</b></p>
        <div className="verify-otp-row">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => { otpRefs.current[index] = el }}
              className="verify-otp-box"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => setOtpDigit(index, e.target.value)}
              onKeyDown={e => onOtpKeyDown(index, e)}
              aria-label={`Digit ${index + 1} of 6`}
            />
          ))}
        </div>
        <button type="button" className="button primary verify-send-btn" onClick={verifyOtp} disabled={!otpValid || verifying}>
          {verifying ? 'Verifying…' : 'Verify mobile'} <span aria-hidden="true">→</span>
        </button>
        <p className="verify-resend"><ClockGlyph /> Didn’t receive it? <button type="button" className="verify-link" onClick={sendOtp} disabled={sending}>Resend code</button></p>
        <div className="verify-otp-divider" aria-hidden="true" />
        <p className="verify-change-number"><PencilGlyph /> You can <button type="button" className="verify-link" onClick={() => setStep('phone')}>change your number</button> if this isn’t correct.</p>
      </>}
      {step === 'success' && <div className="verify-success">
        <img className="verify-success-badge" src="/assets/verify-success.png" alt="" aria-hidden="true" />
        <h3 className="verify-title-otp">Mobile number verified!</h3>
        <p className="modal-sub">Your number has been successfully verified.<br />You’ll be redirected to start your report.</p>
        <div className="verify-success-dots" aria-hidden="true"><span className="dot active" /><span className="dot" /><span className="dot" /></div>
        <div className="verify-otp-divider" aria-hidden="true" />
        <p className="verify-redirect"><ShieldCheckGlyph /> Redirecting in <b>{countdown}</b> second{countdown === 1 ? '' : 's'}…</p>
      </div>}
    </div>
  </div>
}

function Modal({ kind, onClose, onVerified }: { kind: ModalKind; onClose: () => void; onVerified: () => void }) {
  if (!kind) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className={`modal${kind === 'steps' ? ' modal-compact' : ''}${kind === 'verify-mobile' ? ' modal-verify' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={e => e.stopPropagation()}>
      <button className="close" onClick={onClose} aria-label="Close dialog">×</button>
      {kind === 'verify-mobile' && <VerifyMobilePanel onVerified={onVerified} />}
      {kind === 'steps' && <div className="act-now-modal">
        <h2 id="modal-title">What should I do first?</h2>
        <p className="modal-sub">Follow these steps right away to protect yourself and increase the chances of recovery.</p>
        <ol className="act-steps">
          {ACT_NOW_STEPS.map((step, index) => {
            return <li className="act-step" key={step.title}>
              <span className="act-step-icon"><img src={step.image} alt="" aria-hidden="true" /></span>
              <div className="act-step-body">
                <div className="act-step-title-row"><span className="act-step-num">{index + 1}</span><h3>{step.title}</h3></div>
                <p>{step.description}</p>
              </div>
            </li>
          })}
        </ol>
        <div className="act-footer">
          <div className="act-footer-item"><ShieldBoltIcon /><div><b>Acting quickly can help.</b><p>Report as soon as possible and keep your evidence safe.</p></div></div>
          <div className="act-footer-divider" aria-hidden="true" />
          <div className="act-footer-item"><HeadsetIcon /><div><b>Need help?</b><p>Call <a href="tel:1930">1930</a> or reach out to your bank.</p></div></div>
        </div>
      </div>}
      {kind === 'info' && <><p className="eyebrow">HELP</p><h2 id="modal-title">Information to keep</h2><p>Keep the approximate time of the incident, the amount involved, payment references, account or profile details used by the scammer, messages, links, and screenshots.</p><p>This prototype never asks you to submit real financial or identity information.</p></>}
    </section>
  </div>
}

function Header({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (open: boolean) => void }) {
  const closeMenu = () => setMenuOpen(false)
  return <header className="site-header"><div className="container header-inner">
    <Link className="brand" to="/" onClick={closeMenu} aria-label="Sahay home"><span className="mark">S</span><span><b>Sahay</b><small>Cyber Fraud Assistance</small></span></Link>
    <button className="menu-button" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}>Menu</button>
    <nav id="main-nav" className={menuOpen ? 'open' : ''} aria-label="Main navigation">
      <Link to="/" onClick={closeMenu}>Home</Link>
      <Link to="/#report" onClick={closeMenu}>Report</Link>
      <Link to="/track" onClick={closeMenu}>Track report</Link>
      <Link to="/#help" onClick={closeMenu}>Help</Link>
      <button className="language">English <span aria-hidden="true">⌄</span></button>
    </nav>
  </div></header>
}

function PrototypeBanner() {
  return <div className="prototype-banner"><b>● &nbsp; PUBLIC SERVICE PROTOTYPE</b><span>•</span><span>Not an official Government of India website</span></div>
}

function EmergencyBar() {
  return <div className="emergency-bar">
    <span className="emergency-bar-icon" aria-hidden="true"><WarningTriangleIcon /></span>
    <p className="emergency-bar-message">If money was just transferred<br /><b>Call 1930 immediately.</b></p>
    <span className="emergency-bar-divider" aria-hidden="true" />
    <p className="emergency-bar-sub">Contact your bank or payment provider as soon as possible.</p>
    <a className="button primary emergency-bar-btn" href="tel:1930">Call 1930</a>
  </div>
}

function Footer() {
  return <footer><div className="container footer-inner"><div><b>Sahay</b><span>Cyber Fraud Assistance</span></div><div className="footer-links"><a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">National Cyber Crime Reporting Portal</a><a href="tel:1930">1930</a><Link to="/#help">Help</Link><Link to="/">Accessibility</Link></div><p>Public Service Prototype<br />This prototype is not an official Government of India service and does not submit real complaints.</p></div></footer>
}

function Landing({ setModal, onStartReport }: { setModal: (kind: ModalKind) => void; onStartReport: (target: string) => void }) {
  return <main id="top">
    <section className="hero container"><div className="hero-top"><div className="hero-copy"><h1>What happened?</h1><p className="lead">We’ll help you take the right next step.</p><span className="orange-rule"></span><p className="intro">If you’ve experienced online financial fraud, account misuse or another cyber incident, start here.</p></div><HeroArtwork /></div>
      <div className="service-grid" id="report">
        <article className="service-card featured"><CardIllustration type="money" /><div><h2>I lost money</h2><p>UPI, bank transfer, card, investment or online payment fraud.</p><button type="button" onClick={() => onStartReport('/report/assisted')}>Start report <Arrow /></button></div></article>
        <article className="service-card identity"><CardIllustration type="identity" /><div><h2>My account or identity was misused</h2><p>Hacked accounts, impersonation or unauthorized access.</p><button type="button" onClick={() => onStartReport('/report/account-identity/assisted')}>Get help <Arrow /></button></div></article>
        <article className="service-card other wide"><CardIllustration type="other" /><div><h2>Something else happened online</h2><p>Harassment, threats, fake profiles or another cyber issue.</p><button type="button" onClick={() => onStartReport('/report/other/assisted')}>Find the right service <Arrow /></button></div></article>
      </div>
    </section>
    <section className="emergency"><div className="container emergency-inner"><div><p className="eyebrow">IF MONEY WAS JUST TRANSFERRED</p><h2>Call 1930 immediately.</h2><p>If you have just experienced financial cyber fraud, contact 1930 and your bank or payment provider as soon as possible.</p></div><div className="actions"><a className="button primary" href="tel:1930">Call 1930</a><button className="text-link" onClick={() => setModal('steps')}>What should I do first? <Arrow /></button></div></div></section>
    <NextSteps />
    <section className="track container"><div><h2>Already reported?</h2><p>Check your report and understand what happens next.</p></div><Link className="button secondary" to="/track">Track a report <Arrow /></Link></section>
    <section className="help container" id="help"><h2>Need help?</h2><div className="help-grid"><button onClick={() => setModal('info')}>What information should I keep? <Arrow /></button><button onClick={() => setModal('steps')}>What should I do immediately? <Arrow /></button><button onClick={() => setModal('info')}>What happens to my report? <Arrow /></button></div></section>
  </main>
}

function Screens({ setModal, onStartReport }: { setModal: (kind: ModalKind) => void; onStartReport: (target: string) => void }) {
  const { path } = useRouter()
  switch (path) {
    case '/': return <Landing setModal={setModal} onStartReport={onStartReport} />
    case '/track': return <TrackReport />
    case '/report/assisted': return <ReportAssisted />
    case '/report/details': return <ReportDetails />
    case '/report/evidence': return <ReportEvidence />
    case '/report/review': return <ReportReview />
    case '/report/identity': return <ConfirmYourDetails />
    case '/report/identity/upload': return <IdentityDocumentUpload />
    case '/report/identity/digilocker': return <DigiLockerTransition />
    case '/report/identity/digilocker/consent': return <DigiLockerConsent />
    case '/report/identity/digilocker/documents': return <DigiLockerDocuments />
    case '/report/identity/digilocker/confirm': return <DigiLockerConfirm />
    case '/report/identity/digilocker/success': return <DigiLockerSuccess />
    case '/report/submission': return <ReportSubmission />
    case '/report/status': return <ReportStatus />
    case '/report/manual': return <ReportManualEntry />

    case '/report/account-identity/assisted': return <AccountIdentityAssisted />
    case '/report/account-identity/assisted/review': return <AccountIdentityAssistedReview />
    case '/report/account-identity/manual': return <AccountIdentityManual />
    case '/report/account-identity/details': return <ReportDetails />
    case '/report/account-identity/evidence': return <ReportEvidence />
    case '/report/account-identity/review': return <ReportReview />
    case '/report/account-identity/submitted': return <ReportSubmission />
    case '/report/account-identity/status': return <ReportStatus />

    case '/report/other/assisted': return <OtherAssisted />
    case '/report/other/assisted/review': return <OtherAssistedReview />
    case '/report/other/manual': return <OtherManual />
    case '/report/other/details': return <ReportDetails />
    case '/report/other/evidence': return <ReportEvidence />
    case '/report/other/review': return <ReportReview />
    case '/report/other/submitted': return <ReportSubmission />
    case '/report/other/status': return <ReportStatus />

    default: return <NotFound />
  }
}

function Shell() {
  const [modal, setModal] = useState<ModalKind>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [verifyTarget, setVerifyTarget] = useState<string | null>(null)
  const { navigate, path } = useRouter()

  const onStartReport = (target: string) => { setVerifyTarget(target); setModal('verify-mobile') }
  const onVerified = () => {
    setModal(null)
    if (verifyTarget) navigate(verifyTarget)
  }

  return <>
    <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    {path === '/report/assisted' ? <EmergencyBar /> : <PrototypeBanner />}
    <Screens setModal={setModal} onStartReport={onStartReport} />
    <Footer />
    <Modal kind={modal} onClose={() => setModal(null)} onVerified={onVerified} />
  </>
}

function App() {
  return <RouterProvider><ReportProvider><Shell /></ReportProvider></RouterProvider>
}

export default App
