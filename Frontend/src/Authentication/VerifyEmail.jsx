import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

const LENGTH = 6;

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email ?? 'your email';

    const [digits, setDigits] = useState(Array(LENGTH).fill(''));
    const [seconds, setSeconds] = useState(60);
    const inputs = useRef([]);

    useEffect(() => {
        inputs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (seconds === 0) return;
        const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [seconds]);

    function handleChange(index, value) {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);
        if (digit && index < LENGTH - 1) inputs.current[index + 1].focus();
    }

    function handleKeyDown(index, e) {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    }

    function handlePaste(e) {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
        if (!pasted) return;
        e.preventDefault();
        setDigits(Array.from({ length: LENGTH }, (_, i) => pasted[i] ?? ''));
        inputs.current[pasted.length - 1].focus();
    }

    function resend() {
        setSeconds(60);
        setDigits(Array(LENGTH).fill(''));
        inputs.current[0].focus();
        // later: axios.post('/api/email/resend')
    }

    const complete = digits.join('').length === LENGTH;

    function handleSubmit(e) {
        e.preventDefault();
        if (!complete) return;
        // later: axios.post('/api/email/verify', { code: digits.join('') })
        navigate('/welcome'); // later: the home dashboard
    }

    const boxStyle = {
        border: '1px solid #999',
        padding: '12px',
        marginBottom: '12px',
    };

    return (
        <div style={{ maxWidth: '400px', margin: '20px auto', fontFamily: 'sans-serif' }}>

            <div style={boxStyle}>
                <button
                    type="button"
                    onClick={() => navigate('/create-account')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}
                >
                    &larr; Wrong email? Go back
                </button>
            </div>

            <header style={boxStyle}>
                <h1 style={{ margin: '0 0 8px 0' }}>Check your email</h1>
                <p style={{ margin: 0 }}>
                    We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
                </p>
            </header>

            <form onSubmit={handleSubmit} style={boxStyle}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }} onPaste={handlePaste}>
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={(el) => (inputs.current[i] = el)}
                            value={d}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            aria-label={`Digit ${i + 1}`}
                            style={{ width: '44px', height: '52px', textAlign: 'center', fontSize: '20px' }}
                        />
                    ))}
                </div>

                <button type="submit" disabled={!complete} style={{ width: '100%', padding: '8px' }}>
                    Verify email
                </button>
            </form>

            <footer style={boxStyle}>
                <p style={{ margin: 0 }}>
                    Didn&apos;t get it? Check spam, or{' '}
                    {seconds > 0 ? (
                        <span>resend in {seconds}s</span>
                    ) : (
                        <button type="button" onClick={resend}>Resend code</button>
                    )}
                </p>
            </footer>

        </div>
    );
}