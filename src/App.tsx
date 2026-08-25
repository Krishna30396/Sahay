import { FormEvent, useState } from 'react'
import { Link, RouterProvider, useRouter } from './router'
import { ReportProvider } from './reportState'
import { NotFound, ReportAssisted, ReportManualRedirect, ReportStart } from './report'
import { ReportDetails } from './details'
import { ReportEvidence } from './evidence'
import { ReportReview } from './review'

type ModalKind = 'steps' | 'info' | 'track' | 'category' | null

const Arrow = () => <span aria-hidden="true">→</span>

function HeroArtwork() {
  return <div className="hero-art" aria-hidden="true"><img src="/assets/hero-illustration.png" alt="" /></div>
}

function CardIllustration({ type }: { type: 'money' | 'identity' | 'other' }) {
  const images = { money: '/assets/money-fraud.png', identity: '/assets/identity-misuse.png', other: '/assets/other-cyber-issue.png' }
  return <div className="card-art" aria-hidden="true"><img src={images[type]} alt="" /></div>
}

function Modal({ kind, onClose }: { kind: ModalKind; onClose: () => void }) {
  const [tracked, setTracked] = useState(false)
  const submitTrack = (event: FormEvent) => { event.preventDefault(); setTracked(true) }
  if (!kind) return null
  const category = kind === 'category'
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={e => e.stopPropagation()}>
      <button className="close" onClick={onClose} aria-label="Close dialog">×</button>
      {kind === 'steps' && <><p className="eyebrow">ACT NOW</p><h2 id="modal-title">What should I do first?</h2><ol className="steps"><li><strong>Call 1930.</strong> If money was just transferred, contact the financial-cyber-fraud helpline immediately.</li><li><strong>Contact your bank or payment provider.</strong> Ask about securing the transaction.</li><li><strong>Preserve evidence.</strong> Keep messages, payment references and screenshots.</li><li><strong>Report the incident.</strong> Use this prototype to understand the reporting journey.</li></ol></>}
      {kind === 'info' && <><p className="eyebrow">HELP</p><h2 id="modal-title">Information to keep</h2><p>Keep the approximate time of the incident, the amount involved, payment references, account or profile details used by the scammer, messages, links, and screenshots.</p><p>This prototype never asks you to submit real financial or identity information.</p></>}
      {category && <><p className="eyebrow">INFORMATION</p><h2 id="modal-title">This journey is not in the prototype yet</h2><p>Sahay currently demonstrates the financial-fraud reporting journey only. For other cybercrime categories, use the official National Cyber Crime Reporting Portal.</p><a className="button primary" href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">Go to official portal <Arrow /></a></>}
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
        <article className="service-card identity"><CardIllustration type="identity" /><div><h2>My account or identity was misused</h2><p>Hacked accounts, impersonation or unauthorized access.</p><button onClick={() => setModal('category')}>Get help <Arrow /></button></div></article>
        <article className="service-card other wide"><CardIllustration type="other" /><div><h2>Something else happened online</h2><p>Harassment, threats, fake profiles or another cyber issue.</p><button onClick={() => setModal('category')}>Find the right service <Arrow /></button></div></article>
      </div>
    </section>
    <section className="emergency"><div className="container emergency-inner"><div><p className="eyebrow">IF MONEY WAS JUST TRANSFERRED</p><h2>Call 1930 immediately.</h2><p>If you have just experienced financial cyber fraud, contact 1930 and your bank or payment provider as soon as possible.</p></div><div className="actions"><a className="button primary" href="tel:1930">Call 1930</a><button className="text-link" onClick={() => setModal('steps')}>What should I do first? <Arrow /></button></div></div></section>
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
    case '/report/manual': return <ReportManualRedirect />
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
