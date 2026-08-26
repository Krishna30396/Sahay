import { FormEvent, ReactElement, useState } from 'react'
import { Link, RouterProvider, useRouter } from './router'
import { ReportProvider } from './reportState'
import { NotFound, ReportAssisted, ReportManualEntry, ReportStart } from './report'
import { ReportDetails } from './details'
import { ReportEvidence } from './evidence'
import { ReportReview } from './review'
import { ReportSubmission } from './submission'
import { ReportStatus } from './status'
import { ConfirmYourDetails, IdentityDocumentUpload } from './identity'
import { DigiLockerConfirm, DigiLockerConsent, DigiLockerDocuments, DigiLockerSuccess, DigiLockerTransition } from './digilocker'
import { FinalReview } from './finalReview'
import { AccountIdentityAssisted, AccountIdentityAssistedReview, AccountIdentityManual, AccountIdentityStart } from './accountIdentity'
import { OtherAssisted, OtherAssistedReview, OtherManual, OtherStart } from './otherCyber'

type ModalKind = 'steps' | 'info' | 'track' | null

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
function CheckSquareIcon() {
  return <svg {...iconProps()}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
}
function FolderIcon() {
  return <svg {...iconProps()}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
}
function SearchIcon() {
  return <svg {...iconProps()}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function SendIcon() {
  return <svg {...iconProps()}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
}

const NEXT_STEPS: { icon: () => ReactElement; label: string; tone: 'blue' | 'orange' }[] = [
  { icon: MessageIcon, label: 'Tell us what happened', tone: 'blue' },
  { icon: CheckSquareIcon, label: 'Check the details', tone: 'blue' },
  { icon: FolderIcon, label: 'Add relevant evidence', tone: 'orange' },
  { icon: SearchIcon, label: 'Review your report', tone: 'blue' },
  { icon: SendIcon, label: 'Submit when you’re ready', tone: 'orange' },
]

function NextSteps() {
  return <section className="next-steps container">
    <p className="next-steps-title">What happens next</p>
    <div className="next-steps-row">
      {NEXT_STEPS.map((step, index) => {
        const Icon = step.icon
        return <div className="next-step" key={step.label}>
          <span className={`next-step-icon tone-${step.tone}`}>
            <span className="next-step-num" aria-hidden="true">{index + 1}</span>
            <Icon />
          </span>
          <p>{step.label}</p>
        </div>
      })}
    </div>
    <p className="next-steps-pill">✓ You’ll see everything before anything is submitted.</p>
  </section>
}

function Modal({ kind, onClose }: { kind: ModalKind; onClose: () => void }) {
  const [tracked, setTracked] = useState(false)
  const submitTrack = (event: FormEvent) => { event.preventDefault(); setTracked(true) }
  if (!kind) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={e => e.stopPropagation()}>
      <button className="close" onClick={onClose} aria-label="Close dialog">×</button>
      {kind === 'steps' && <><p className="eyebrow">ACT NOW</p><h2 id="modal-title">What should I do first?</h2><ol className="steps"><li><strong>Call 1930.</strong> If money was just transferred, contact the financial-cyber-fraud helpline immediately.</li><li><strong>Contact your bank or payment provider.</strong> Ask about securing the transaction.</li><li><strong>Preserve evidence.</strong> Keep messages, payment references and screenshots.</li><li><strong>Report the incident.</strong> Use this prototype to understand the reporting journey.</li></ol></>}
      {kind === 'info' && <><p className="eyebrow">HELP</p><h2 id="modal-title">Information to keep</h2><p>Keep the approximate time of the incident, the amount involved, payment references, account or profile details used by the scammer, messages, links, and screenshots.</p><p>This prototype never asks you to submit real financial or identity information.</p></>}
      {kind === 'track' && <><p className="eyebrow">DEMO TRACKING</p><h2 id="modal-title">Track your report</h2>{!tracked ? <form onSubmit={submitTrack}><label htmlFor="report-id">Enter your demo report ID</label><input id="report-id" defaultValue="NCRP-DEMO-48291" aria-describedby="demo-id" /><p id="demo-id" className="helper">Demo: use NCRP-DEMO-48291</p><button className="button primary" type="submit">Check status <Arrow /></button></form> : <div className="timeline"><div className="done"><b>Report submitted</b><span>23 Aug · 7:18 PM</span></div><div className="current"><b>Under review</b><span>Your demo complaint is awaiting review.</span></div><div><b>Forwarded to relevant authority</b></div><div><b>Further action</b></div></div>}</>}
    </section>
  </div>
}

function Header({ menuOpen, setMenuOpen, onTrack }: { menuOpen: boolean; setMenuOpen: (open: boolean) => void; onTrack: () => void }) {
  const closeMenu = () => setMenuOpen(false)
  return <header className="site-header"><div className="container header-inner">
    <Link className="brand" to="/" onClick={closeMenu} aria-label="Sahay home"><span className="mark">S</span><span><b>Sahay</b><small>Cyber Fraud Assistance</small></span></Link>
    <button className="menu-button" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}>Menu</button>
    <nav id="main-nav" className={menuOpen ? 'open' : ''} aria-label="Main navigation">
      <Link to="/" onClick={closeMenu}>Home</Link>
      <Link to="/#report" onClick={closeMenu}>Report</Link>
      <button onClick={() => { onTrack(); closeMenu() }}>Track report</button>
      <Link to="/#help" onClick={closeMenu}>Help</Link>
      <button className="language">English <span aria-hidden="true">⌄</span></button>
    </nav>
  </div></header>
}

function PrototypeBanner() {
  return <div className="prototype-banner"><b>● &nbsp; PUBLIC SERVICE PROTOTYPE</b><span>•</span><span>Not an official Government of India website</span></div>
}

function Footer() {
  return <footer><div className="container footer-inner"><div><b>Sahay</b><span>Cyber Fraud Assistance</span></div><div className="footer-links"><a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">National Cyber Crime Reporting Portal</a><a href="tel:1930">1930</a><Link to="/#help">Help</Link><Link to="/">Accessibility</Link></div><p>Public Service Prototype<br />This prototype is not an official Government of India service and does not submit real complaints.</p></div></footer>
}

function Landing({ setModal }: { setModal: (kind: ModalKind) => void }) {
  return <main id="top">
    <section className="hero container"><div className="hero-top"><div className="hero-copy"><h1>What happened?</h1><p className="lead">We’ll help you take the right next step.</p><span className="orange-rule"></span><p className="intro">If you’ve experienced online financial fraud, account misuse or another cyber incident, start here.</p></div><HeroArtwork /></div>
      <div className="service-grid" id="report">
        <article className="service-card featured"><CardIllustration type="money" /><div><h2>I lost money</h2><p>UPI, bank transfer, card, investment or online payment fraud.</p><Link to="/report/start">Start report <Arrow /></Link></div></article>
        <article className="service-card identity"><CardIllustration type="identity" /><div><h2>My account or identity was misused</h2><p>Hacked accounts, impersonation or unauthorized access.</p><Link to="/report/account-identity/start">Get help <Arrow /></Link></div></article>
        <article className="service-card other wide"><CardIllustration type="other" /><div><h2>Something else happened online</h2><p>Harassment, threats, fake profiles or another cyber issue.</p><Link to="/report/other/start">Find the right service <Arrow /></Link></div></article>
      </div>
    </section>
    <section className="emergency"><div className="container emergency-inner"><div><p className="eyebrow">IF MONEY WAS JUST TRANSFERRED</p><h2>Call 1930 immediately.</h2><p>If you have just experienced financial cyber fraud, contact 1930 and your bank or payment provider as soon as possible.</p></div><div className="actions"><a className="button primary" href="tel:1930">Call 1930</a><button className="text-link" onClick={() => setModal('steps')}>What should I do first? <Arrow /></button></div></div></section>
    <NextSteps />
    <section className="track container"><div><h2>Already reported?</h2><p>Check your report and understand what happens next.</p></div><button className="button secondary" onClick={() => setModal('track')}>Track a report <Arrow /></button></section>
    <section className="help container" id="help"><h2>Need help?</h2><div className="help-grid"><button onClick={() => setModal('info')}>What information should I keep? <Arrow /></button><button onClick={() => setModal('steps')}>What should I do immediately? <Arrow /></button><button onClick={() => setModal('info')}>What happens to my report? <Arrow /></button></div></section>
  </main>
}

function Screens({ setModal }: { setModal: (kind: ModalKind) => void }) {
  const { path } = useRouter()
  switch (path) {
    case '/': return <Landing setModal={setModal} />
    case '/report/start': return <ReportStart />
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
    case '/report/final-review': return <FinalReview />
    case '/report/submission': return <ReportSubmission />
    case '/report/status': return <ReportStatus />
    case '/report/manual': return <ReportManualEntry />

    case '/report/account-identity/start': return <AccountIdentityStart />
    case '/report/account-identity/assisted': return <AccountIdentityAssisted />
    case '/report/account-identity/assisted/review': return <AccountIdentityAssistedReview />
    case '/report/account-identity/manual': return <AccountIdentityManual />
    case '/report/account-identity/details': return <ReportDetails />
    case '/report/account-identity/evidence': return <ReportEvidence />
    case '/report/account-identity/review': return <ReportReview />
    case '/report/account-identity/submitted': return <ReportSubmission />
    case '/report/account-identity/status': return <ReportStatus />

    case '/report/other/start': return <OtherStart />
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
  return <>
    <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} onTrack={() => setModal('track')} />
    <PrototypeBanner />
    <Screens setModal={setModal} />
    <Footer />
    <Modal kind={modal} onClose={() => setModal(null)} />
  </>
}

function App() {
  return <RouterProvider><ReportProvider><Shell /></ReportProvider></RouterProvider>
}

export default App
