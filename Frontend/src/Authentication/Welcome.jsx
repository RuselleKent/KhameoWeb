import { Link } from 'react-router';

export default function Welcome() {
    return (
        <div className="min-h-screen grid place-items-center p-6">
            <div className="w-full max-w-sm space-y-6 text-center">
                <h1 className="text-3xl font-bold text-[#0E2B29]">Welcome to Khameo</h1>
                <p className="text-gray-600">
                    Practice speaking at your own pace, or rehearse together with your team
                </p>

                <div className="space-y-3">
                    <Link
                        to="/create-account"
                        className="block w-full rounded-xl bg-[#FD8B47] py-3 font-semibold text-[#1A120C] hover:bg-[#EE7432]"
                    >
                        Create Account
                    </Link>

                    <Link
                        to="/login"
                        className="block w-full rounded-xl border border-gray-300 bg-white py-3 font-semibold text-[#0E2B29] hover:bg-gray-50"
                    >
                        I already have an account
                    </Link>
                </div>

                <p className="text-sm text-gray-500">
                    By continuing, you agree to our{' '}
                    <Link to="/terms" className="font-semibold text-[#0B6B66] underline">Terms</Link> and{' '}
                    <Link to="/privacy-policy" className="font-semibold text-[#0B6B66] underline">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}