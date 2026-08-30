import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Login.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <Head>
          <title>pwnlab · sign up</title>
          <meta name="description" content="Create a pwnlab account" />
        </Head>

        <Layout>
          <div className={styles.container}>
            <div className={styles.loginBox}>
              <div className={styles.header}>
                <div className={styles.kicker}>account created</div>
                <h1>pwnlab</h1>
                <p>check your email</p>
              </div>

              <div className={styles.divider} />

              <div className={styles.success}>
                We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                <br /><br />
                Click the link in the email to activate your account, then log in.
              </div>

              <div className={styles.divider} />

              <div className={styles.footer}>
                <p>Already have an account?</p>
                <Link href="/login" className={styles.link}>Log in →</Link>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>pwnlab · sign up</title>
        <meta name="description" content="Create a pwnlab account" />
      </Head>

      <Layout requireAuth={false}>
        <div className={styles.container}>
          <div className={styles.loginBox}>
            <div className={styles.header}>
              <div className={styles.kicker}>create account</div>
              <h1>pwnlab</h1>
              <p>join the platform</p>
            </div>

            <div className={styles.divider} />

            {error && (
              <div className={styles.error}>
                [ERROR]
                <br />
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="username">USERNAME</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="operator"
                />
              </div>

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

              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? 'creating account...' : 'sign up →'}
              </button>
            </form>

            <div className={styles.divider} />

            <div className={styles.footer}>
              <p>Already have an account?</p>
              <Link href="/login" className={styles.link}>Log in →</Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}