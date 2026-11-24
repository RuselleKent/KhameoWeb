import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import AuthLayout from '../components/AuthLayout';

const legalLink = 'font-bold text-brand underline underline-offset-2 hover:text-brand-dark';

export default function WelcomePage() {
  return (
    <AuthLayout>
      <title>Welcome · Khameo</title>

      <div className="flex max-w-[400px] flex-col gap-5">
        <div>
          <h1 className="text-[32px] leading-tight text-ink">Welcome to Khameo</h1>
          <p className="mt-2 text-sm leading-[21px] text-muted">
            Practice speaking at your own pace, or rehearse together with your team.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button to="/signup" size="block">
            Create account
          </Button>
          <Button to="/login" variant="secondary" size="block">
            I already have an account
          </Button>
        </div>

        <p className="text-center text-xs leading-[18px] text-muted">
          By continuing, you agree to our{' '}
          <Link to="/terms" className={legalLink}>
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className={legalLink}>
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </AuthLayout>
  );
}
