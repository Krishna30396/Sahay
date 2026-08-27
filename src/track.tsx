import { Link } from './router'

function iconProps() {
  return { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
}

function CheckGlyph() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="5 13 10 18 19 7" /></svg>
}

function ClockGlyph() {
  return <svg {...iconProps()}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
}

function InfoGlyph() {
  return <svg {...iconProps()}><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" /></svg>
}

function ClipboardGlyph() {
  return <svg {...iconProps()}><rect x="6" y="4" width="12" height="17" rx="2" /><rect x="9" y="2.5" width="6" height="3" rx="1" /><line x1="9" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
}

function ShieldBoltGlyph() {
  return <svg {...iconProps()}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><polyline points="13 8 10 13 13 13 11 17" /></svg>
}

function PersonGlyph() {
  return <svg {...iconProps()}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
}

function BuildingGlyph() {
  return <svg {...iconProps()}><path d="M3 10l9-6 9 6" /><line x1="4" y1="10" x2="4" y2="19" /><line x1="20" y1="10" x2="20" y2="19" /><line x1="8" y1="10" x2="8" y2="19" /><line x1="12" y1="10" x2="12" y2="19" /><line x1="16" y1="10" x2="16" y2="19" /><line x1="2.5" y1="21" x2="21.5" y2="21" /></svg>
}

function BellGlyph() {
  return <svg {...iconProps()}><path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
}

function CopyGlyph() {
  return <svg {...iconProps()}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
}

const TIMELINE = [
  {
    status: 'done' as const,
    title: 'Report submitted',
    sub: '23 Aug 2026 · 7:18 PM',
    pill: { tone: 'success' as const, icon: CheckGlyph, text: 'Your report has been successfully submitted.' },
  },
  {
    status: 'current' as const,
    title: 'Under review',
    sub: 'Your demo complaint is awaiting review.',
    pill: { tone: 'info' as const, icon: ClockGlyph, text: 'Usually takes 1–2 working days.' },
  },
  {
    status: 'upcoming' as const,
    title: 'Forwarded to relevant authority',
    sub: 'The report will be sent to the appropriate authority for action.',
    pill: null,
  },
  {
    status: 'upcoming' as const,
    title: 'Further action',
    sub: 'The authority will take necessary steps and keep you updated.',
    pill: null,
  },
]

const NEXT_STEPS = [
  { icon: PersonGlyph, text: 'Our team reviews your report' },
  { icon: BuildingGlyph, text: 'If needed, it is forwarded to the relevant authority' },
  { icon: BellGlyph, text: 'You’ll receive updates on this report' },
]

export function TrackReport() {
  return <main className="report-page report-page-wide track-page">
    <div className="track-layout">
      <div className="track-main">
        <span className="track-badge">Demo tracking</span>
        <h1>Track your report</h1>
        <p className="lead">Here’s where your report stands right now.</p>

        <section className="track-card">
          <ol className="track-timeline">
            {TIMELINE.map(step => <li key={step.title} className={step.status}>
              <span className="track-timeline-dot" aria-hidden="true">
                {step.status === 'done' && <CheckGlyph />}
                {step.status === 'current' && <span className="track-timeline-dot-inner" />}
              </span>
              <div className="track-timeline-body">
                <h3>{step.title}</h3>
                <p className="track-timeline-sub">{step.sub}</p>
                {step.pill && <p className={`track-timeline-pill ${step.pill.tone}`}><step.pill.icon /> {step.pill.text}</p>}
              </div>
            </li>)}
          </ol>
        </section>

        <div className="track-footer-bar">
          <span className="track-footer-note"><InfoGlyph /> This is a demo. No real complaint has been filed.</span>
          <Link className="button primary" to="/">Close</Link>
        </div>
      </div>

      <aside className="track-sidebar">
        <div className="track-side-card">
          <span className="track-side-icon"><ClipboardGlyph /></span>
          <div>
            <p className="track-side-label">Report ID</p>
            <p className="track-side-value">SAHY2508230007 <button type="button" className="track-side-copy" aria-label="Copy report ID" onClick={() => navigator.clipboard?.writeText('SAHY2508230007')}><CopyGlyph /></button></p>
            <p className="track-side-label track-side-label-spaced">Submitted on</p>
            <p className="track-side-value track-side-value-small">23 Aug 2026 · 7:18 PM</p>
          </div>
        </div>

        <div className="track-side-card highlight">
          <img className="track-side-watermark" src="/assets/shield-watermark.png" alt="" aria-hidden="true" />
          <div className="track-highlight-row">
            <span className="track-side-icon shield"><ShieldBoltGlyph /></span>
            <div>
              <h4>We’re on it.</h4>
              <p>Your report is important to us. We’ll keep you updated at every step.</p>
            </div>
          </div>
        </div>

        <div className="track-side-card stack next-steps-card">
          <h4>What happens next?</h4>
          <ul className="track-next-list">
            {NEXT_STEPS.map(item => <li key={item.text}><span className="track-next-icon"><item.icon /></span><span>{item.text}</span></li>)}
          </ul>
        </div>

        <div className="track-side-card note">
          <BellGlyph />
          <p>We’ll notify you at <strong>+91 98765 43210</strong> for any updates regarding this report.</p>
        </div>
      </aside>
    </div>
  </main>
}
