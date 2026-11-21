import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

export default function BeforeYouRecord() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;   // passed from Create Account

    const [agreed, setAgreed] = useState(false);

    const boxStyle = {
        border: '1px solid #999',
        padding: '12px',
        marginBottom: '12px',
    };

    const items = [
        { title: 'What we record', description: 'Solo sessions, group submissions and live rehearsals.' },
        { title: 'How AI is used', description: 'Only to transcribe and evaluate. Never used to train models. AI feedback can be wrong.' },
        { title: 'Who can see it', description: 'You, and in groups only your Hosts and Coaches.' },
        { title: 'How long we keep it', description: 'Stream-only. Deleted 90 days after the study period.' },
        { title: 'Your choice', description: 'Taking part is voluntary. You can withdraw any time in Settings.' },
    ];

    function handleAgree(e) {
        e.preventDefault();
        if (!agreed) return;
        // later: save consent to Laravel
        navigate('/verify-email', { state: { email, recordingConsent: true } });
    }

    function handleNotNow() {
        // they can still verify and use the app, just can't record yet
        navigate('/verify-email', { state: { email, recordingConsent: false } });
    }

    return (
        <div style={{ maxWidth: '400px', margin: '20px auto', fontFamily: 'sans-serif' }}>

            <header style={boxStyle}>
                <h1 style={{ margin: '0 0 8px 0' }}>Before you record</h1>
                <p style={{ margin: 0 }}>
                    Your voice recordings are personal data. Here&apos;s how Khameo uses them.
                </p>
            </header>

            <section style={boxStyle}>
                {items.map((item, index) => (
                    <div key={item.title} style={{ marginBottom: index === items.length - 1 ? 0 : '12px' }}>
                        <strong>{item.title}</strong>
                        <p style={{ margin: '4px 0 0 0' }}>{item.description}</p>
                    </div>
                ))}
            </section>

            <form onSubmit={handleAgree} style={boxStyle}>
                <div style={{ marginBottom: '12px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                        />{' '}
                        I understand how my recordings are used and I agree.
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={!agreed}
                    style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                >
                    Agree and continue
                </button>

                <button
                    type="button"
                    onClick={handleNotNow}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: 'none',
                        border: '1px solid #ccc',
                        cursor: 'pointer',
                    }}
                >
                    Not now
                </button>
            </form>

        </div>
    );
}