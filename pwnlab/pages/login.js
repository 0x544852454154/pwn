import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import styles from '../styles/Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState('pin'); // 'pin' or 'email'
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setResendStatus('');
    setLoading(true);

    try {
      const body = method === 'pin'
        ? { username: username.toLowerCase().trim(), pin }
        : { email, password };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  async function handleResendPin() {
    if (!username) {
      setError('Enter your username first.');
      return;
    }

    setResendStatus('');
    setResendLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend PIN');
      } else {
        setResendStatus(data.message || 'PIN sent to Discord DMs');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>pwnlab · login</title>
        <meta name="description" content="Log in to pwnlab platform" />
      </Head>

      <Layout>
        <div className={styles.container}>
          <div className={styles.loginBox}>
            <div className={styles.header}>
              <div className={styles.kicker}>secure access / console</div>
              <h1>pwnlab</h1>
              <p>security console</p>
            </div>

            <div className={styles.divider} />

            {error && (
              <div className={styles.error}>
                [ERROR]
                <br />
                {error}
              </div>
            )}

            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${method === 'pin' ? styles.tabActive : ''}`}
                onClick={() => setMethod('pin')}
              >
                PIN / DISCORD
              </button>
              <button
                type="button"
                className={`${styles.tab} ${method === 'email' ? styles.tabActive : ''}`}
                onClick={() => setMethod('email')}
              >
                EMAIL
              </button>
            </div>

            <form onSubmit={handleLogin} className={styles.form}>
              {method === 'pin' ? (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="username">USERNAME</label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      autoFocus
                      required
                      minLength={3}
                      maxLength={50}
                      placeholder="operator"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="pin">PIN</label>
                    <input
                      id="pin"
                      type="password"
                      name="pin"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      disabled={loading}
                      required
                      pattern="[0-9]{6}"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="email">EMAIL</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="password">PASSWORD</label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      minLength={6}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? 'authenticating...' : 'login →'}
              </button>

              {method === 'pin' && (
                <div className={styles.resendRow}>
                  <span className={styles.resendText}>Lost your PIN?</span>
                  <button
                    type="button"
                    onClick={handleResendPin}
                    disabled={resendLoading || !username}
                    className={styles.resendBtn}
                  >
                    {resendLoading ? 'sending...' : 'resend pin'}
                  </button>
                </div>
              )}

              {resendStatus && (
                <div className={styles.resendSuccess}>
                  {resendStatus}
                </div>
              )}
            </form>

            <div className={styles.divider} />

            <div className={styles.footer}>
              <p>No account yet?</p>
              <p>Use <code>/xlogin</code> in Discord or sign up with email.</p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}