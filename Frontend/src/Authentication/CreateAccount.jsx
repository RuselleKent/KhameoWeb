import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

export default function CreateAccount() {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const [errors, setErrors] = useState({});

    function update(field, value) {
        setForm({ ...form, [field]: value });
        setErrors({ ...errors, [field]: undefined });
    }

    function validate() {
        const e = {};
        if (!form.name.trim()) e.name = 'Enter your full name.';
        if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.';
        if (form.password.length < 8) e.password = 'Use at least 8 characters.';
        if (form.password_confirmation !== form.password) e.password_confirmation = 'Passwords must match.';
        if (!form.terms) e.terms = 'Please agree to the Terms and Privacy Policy.';
        return e;
    }

    function handleSubmit(event) {
        event.preventDefault();
        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        // later: axios.post('/api/register', form)
        navigate('/consent', { state: { email: form.email } });
    }

    const boxStyle = {
        border: '1px solid #999',
        padding: '12px',
        marginBottom: '12px',
    };

    const errorStyle = { color: '#B3261E', fontSize: '13px', margin: '4px 0 0' };

    return (
        <div style={{ maxWidth: '400px', margin: '20px auto', fontFamily: 'sans-serif' }}>

            <div style={boxStyle}>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}
                >
                    &larr; Back
                </button>
            </div>

            <header style={boxStyle}>
                <h1 style={{ margin: '0 0 8px 0' }}>Create your Account</h1>
                <p style={{ margin: 0 }}>Free to start. Takes under a minute</p>
            </header>

            <div style={boxStyle}>
                <button type="button" style={{ width: '100%', padding: '8px' }}>
                    Continue with Google account
                </button>
            </div>

            <form onSubmit={handleSubmit} noValidate style={boxStyle}>

                <div style={{ marginBottom: '12px' }}>
                    <label htmlFor="fullName" style={{ display: 'block' }}>Full name</label>
                    <input
                        id="fullName"
                        type="text"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        autoComplete="name"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                    {errors.name && <p style={errorStyle}>{errors.name}</p>}
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label htmlFor="email" style={{ display: 'block' }}>Email</label>
                    <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        autoComplete="email"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                    {errors.email && <p style={errorStyle}>{errors.email}</p>}
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label htmlFor="password" style={{ display: 'block' }}>Password</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={(e) => update('password', e.target.value)}
                            autoComplete="new-password"
                            style={{ flex: 1 }}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? 'Hide' : 'Show'} Password
                        </button>
                    </div>
                    {errors.password && <p style={errorStyle}>{errors.password}</p>}
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label htmlFor="confirmPassword" style={{ display: 'block' }}>Confirm Password</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={form.password_confirmation}
                            onChange={(e) => update('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            style={{ flex: 1 }}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? 'Hide' : 'Show'} Password
                        </button>
                    </div>
                    {errors.password_confirmation && <p style={errorStyle}>{errors.password_confirmation}</p>}
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={form.terms}
                            onChange={(e) => update('terms', e.target.checked)}
                        />{' '}
                        I agree to the <Link to="/terms">Terms</Link> and{' '}
                        <Link to="/privacy-policy">Privacy Policy</Link>
                    </label>
                    {errors.terms && <p style={errorStyle}>{errors.terms}</p>}
                </div>

                <button type="submit" style={{ width: '100%', padding: '8px' }}>
                    Create Account
                </button>
            </form>

            <footer style={boxStyle}>
                <p style={{ margin: 0 }}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </footer>

        </div>
    );
}