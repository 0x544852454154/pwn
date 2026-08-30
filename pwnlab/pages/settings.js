import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Login.module.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [bio, setBio] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showDiscordStatus, setShowDiscordStatus] = useState(true);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [changingPin, setChangingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSettings(data.settings);
      setBio(data.settings.bio || '');
      setEmailNotifications(data.settings.email_notifications);
      setPublicProfile(data.settings.public_profile);
      setShowDiscordStatus(data.settings.show_discord_status);
      setError('');
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, email_notifications: emailNotifications, public_profile: publicProfile, show_discord_status: showDiscordStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      setMessage('Settings saved');
      fetchSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePin(e) {
    e.preventDefault();
    setChangingPin(true);
    setPinMessage('');
    setPinError('');
    try {
      const response = await fetch('/api/settings/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change PIN');
      setPinMessage('PIN changed successfully');
      setCurrentPin('');
      setNewPin('');
    } catch (err) {
      setPinError(err.message);
    } finally {
      setChangingPin(false);
    }
  }

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.loading}>loading settings...</div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>pwnlab · settings</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.kicker}>operator console / settings</div>
            <h1>settings</h1>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          {message && (
            <div className={styles.success}>{message}</div>
          )}

          <div className={styles.sections}>
            <section className={styles.section}>
              <h2>profile</h2>
              <form onSubmit={handleSaveSettings}>
                <div className={styles.formGroup}>
                  <label htmlFor="bio">bio</label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    rows={4}
                  />
                </div>
                <div className={styles.checkboxGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={publicProfile}
                      onChange={(e) => setPublicProfile(e.target.checked)}
                    />
                    public profile
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={showDiscordStatus}
                      onChange={(e) => setShowDiscordStatus(e.target.checked)}
                    />
                    show discord status
                  </label>
                </div>
                <button type="submit" disabled={saving}>
                  {saving ? 'saving...' : 'save profile →'}
                </button>
              </form>
            </section>

            <section className={styles.section}>
              <h2>notifications</h2>
              <form onSubmit={handleSaveSettings}>
                <div className={styles.checkboxGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    email notifications
                  </label>
                </div>
                <button type="submit" disabled={saving}>
                  {saving ? 'saving...' : 'save notifications →'}
                </button>
              </form>
            </section>

            <section className={styles.section}>
              <h2>security</h2>
              <form onSubmit={handleChangePin}>
                {pinMessage && <div className={styles.success}>{pinMessage}</div>}
                {pinError && (
                  <div className={styles.error}>
                    [ERROR]
                    <br />
                    {pinError}
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label htmlFor="currentPin">current pin</label>
                  <input
                    id="currentPin"
                    type="password"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    maxLength={6}
                    pattern="\d{6}"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="newPin">new pin</label>
                  <input
                    id="newPin"
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    maxLength={6}
                    pattern="\d{6}"
                    required
                  />
                </div>
                <button type="submit" disabled={changingPin}>
                  {changingPin ? 'updating...' : 'change pin →'}
                </button>
              </form>
            </section>

            <section className={styles.section}>
              <h2>quick links</h2>
              <nav className={styles.linkList}>
                <Link href="/submissions" className={styles.link}>
                  submission history ↗
                </Link>
                <Link href="/notifications" className={styles.link}>
                  notifications ↗
                </Link>
              </nav>
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
}
