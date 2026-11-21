import React, { useState } from 'react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Add login logic here
    };

    return (
        <main style={styles.container}>
            
            <a href="/welcome" style={styles.link}>
                ← Back
            </a>

           
            <h1 style={styles.heading}>Welcome Back</h1>
            <p style={styles.paragraph}>Log in to Keep Practicing</p>

            {/* Google Login Button */}
            <a href="" role="button" style={styles.googleButton}>
                Continue with Google
            </a>

           
            <div style={styles.divider}>
                <span>or</span>
            </div>

           
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.fieldGroup}>
                    <label htmlFor="email" style={styles.label}>
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        style={styles.input}
                    />
                </div>

                <div style={styles.fieldGroup}>
                    <label htmlFor="password" style={styles.label}>
                        Password
                    </label>
                    <div style={styles.passwordWrapper}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            required
                            style={{ ...styles.input, flex: 1 }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={styles.toggleButton}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

               
                <div style={styles.rowRight}>
                    <a href="" style={styles.link}>
                        Forgot Password?
                    </a>
                </div>

           
                <div style={styles.checkboxRow}>
                    <input
                        type="checkbox"
                        id="keep-signed-in"
                        name="keepSignedIn"
                    />
                    <label htmlFor="keep-signed-in" style={styles.checkboxLabel}>
                        Keep me signed in
                    </label>
                </div>

               
                <button type="submit" style={styles.primaryButton}>
                    Login
                </button>
            </form>

           
            <p style={styles.footerText}>
                New to Khameo?{' '}
                <a href="/create-account" style={styles.link}>
                    Create Account
                </a>
            </p>
        </main>
    );
}

const styles = {
    container: {
        maxWidth: '380px',
        margin: '40px auto',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
    },
    heading: {
        margin: '16px 0 4px',
        fontSize: '24px',
    },
    paragraph: {
        margin: '0 0 20px',
        color: '#555555',
        fontSize: '14px',
    },
    link: {
        color: '#0066cc',
        textDecoration: 'underline',
        fontSize: '14px',
        cursor: 'pointer',
    },
    googleButton: {
        display: 'block',
        textAlign: 'center',
        padding: '10px',
        border: '1px solid #cccccc',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        color: '#222222',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '14px',
    },
    divider: {
        textAlign: 'center',
        margin: '16px 0',
        color: '#888888',
        fontSize: '13px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '500',
    },
    input: {
        padding: '8px 10px',
        border: '1px solid #cccccc',
        borderRadius: '6px',
        fontSize: '14px',
    },
    passwordWrapper: {
        display: 'flex',
        gap: '6px',
    },
    toggleButton: {
        padding: '0 12px',
        border: '1px solid #cccccc',
        borderRadius: '6px',
        backgroundColor: '#f5f5f5',
        cursor: 'pointer',
        fontSize: '13px',
    },
    rowRight: {
        textAlign: 'right',
    },
    checkboxRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    checkboxLabel: {
        fontSize: '14px',
    },
    primaryButton: {
        padding: '10px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: '#111111',
        color: '#ffffff',
        fontWeight: '600',
        fontSize: '15px',
        cursor: 'pointer',
    },
    footerText: {
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#555555',
    },
};
