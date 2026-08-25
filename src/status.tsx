import { Link } from './router'
import { ReportCategory, useReport } from './reportState'

interface TimelineStep {
  label: string
  state: 'done' | 'current' | 'upcoming'
}

const CONTENT: Record<'account-identity' | 'other-cyber', { title: string; timeline: TimelineStep[]; explanation: string }> = {
  'account-identity': {
    title: 'Your report has been prepared',
    timeline: [
      { label: 'Information collected', state: 'done' },
      { label: 'Evidence added', state: 'done' },
      { label: 'Ready for official reporting', state: 'current' },
      { label: 'Official reporting', state: 'upcoming' },
      { label: 'Further action', state: 'upcoming' },
    ],
    explanation: 'Sahay is a prototype that helps organize your information. Any real investigation, account recovery or enforcement would happen through the relevant service provider or authority.',
  },
  'other-cyber': {
    title: 'Your report is ready for the next step',
    timeline: [
      { label: 'Information collected', state: 'done' },
      { label: 'Evidence added', state: 'done' },
      { label: 'Ready for official reporting', state: 'current' },
    ],
    explanation: 'Sahay helps you organize what happened. Any real investigation or action depends on the appropriate platform, service provider or authority.',
  },
}

export function ReportStatus() {
  const { report } = useReport()
  const category: ReportCategory = report.category === 'other-cyber' ? 'other-cyber' : 'account-identity'
  const content = CONTENT[category]

  return <main className="report-page">
    <div className="report-intro">
      <h1>{content.title}</h1>
    </div>
    <div className="timeline">
      {content.timeline.map(step => (
        <div key={step.label} className={step.state === 'upcoming' ? undefined : step.state}>
          <b>{step.label}</b>
        </div>
      ))}
    </div>
    <p className="helper">{content.explanation}</p>
    <Link className="button secondary" to="/">Return to homepage</Link>
  </main>
}
