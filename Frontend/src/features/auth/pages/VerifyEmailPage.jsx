import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

// Placeholder until the verify-email screen is designed and built.
export default function VerifyEmailPage() {
  const email = useLocation().state?.email;

  return (
    <AuthLayout>
      <title>Verify your email · Khameo</title>
      <h1 className="text-[32px] leading-tight text-ink">Check your email</h1>
      <p className="mt-2 text-sm leading-[21px] text-muted">
        {email ? (
          <>
            We sent a verification link to <span className="font-semibold text-ink">{email}</span>.
          </>
        ) : (
          'We sent you a verification link.'
        )}{' '}
        This screen is coming soon.
      </p>
      <Link to="/login" className="mt-6 inline-block text-sm font-bold text-brand underline underline-offset-2">
        Back to log in
      </Link>
    </AuthLayout>
  );
}
