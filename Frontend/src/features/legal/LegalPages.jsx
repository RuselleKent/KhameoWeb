import { Link } from 'react-router-dom';
import Logo from '../../components/layout/Logo';
import Alert from '../../components/ui/Alert';

// Placeholder pages so the Terms and Privacy links on /welcome and /signup work.
// The full texts are still being written; these list only rules Khameo already follows.

function LegalPage({ title, points }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <title>{`${title} · Khameo`}</title>
      <header className="px-4 py-5 sm:px-10">
        <Link to="/" className="block w-fit rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[672px] px-4 pt-6 pb-16 sm:pt-10">
        <article className="rounded-card bg-white p-6 sm:p-10">
          <h1 className="text-[32px] leading-tight text-ink">{title}</h1>
          <Alert variant="info" className="mt-5">
            This is a summary. The full text is being written for the KHAMEO thesis study and will replace this page.
          </Alert>
          <ul className="mt-6 flex list-disc flex-col gap-3 pl-5 text-[15px] leading-6 text-ink">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted">
            <Link to="/" className="font-bold text-brand underline underline-offset-2 hover:text-brand-dark">
              Back to Khameo
            </Link>
          </p>
        </article>
      </main>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      points={[
        'You must be 18 or older to use Khameo.',
        'Khameo is a public-speaking practice platform built for the KHAMEO thesis study at ACLC College of Sta. Maria.',
        'In groups, roles are set per group: Primary Host, Co-Host, Coach and Member.',
        'Activities lock at their deadline; late submissions aren’t accepted.',
        'Results are published only after every submission is graded.',
      ]}
    />
  );
}

export function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      points={[
        'We record your voice only for solo sessions, group submissions and Real Time Rehearsals, and only after you agree.',
        'AI is used only to transcribe and evaluate recordings. It is never used to train models, and its feedback can be wrong.',
        'Your recordings are seen by you and, in groups, only by your Hosts and Coaches.',
        'Audio is stream-only: it can’t be downloaded. Recordings are deleted 90 days after the study period.',
        'Taking part is voluntary. You can withdraw your consent any time in Settings.',
      ]}
    />
  );
}
