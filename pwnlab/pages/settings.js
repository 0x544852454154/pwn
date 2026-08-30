import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Settings.module.css';

const TABS = [
  { id: 'profile', label: 'profile', icon: '◎' },
  { id: 'notifications', label: 'notifications', icon: '◉' },
  { id: 'security', label: 'security', icon: '◆' },
  { id: 'quick-links', label: 'quick links', icon: '↗' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

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

          <div className={styles.layout}>
            <nav className={styles.sidebar}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.sidebarItem} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={styles.sidebarIcon}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className={styles.content}>
              {activeTab === 'profile' && (
                <section className={styles.section}>
                  <h2>profile</h2>
                  <p className={styles.sectionDescription}>
                    Manage your public profile information and visibility preferences.
                  </p>
                  <form onSubmit={handleSaveSettings}>
                    <div className={styles.formGroup}>
                      <label htmlFor="bio">bio</label>
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={500}
                        rows={4}
                        placeholder="Describe your operator background, specialties, and interests..."
                      />
                    </div>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={publicProfile}
                          onChange={(e) => setPublicProfile(e.target.checked)}
                        />
                        <span className={styles.checkboxText}>
                          <span className={styles.checkboxTitle}>public profile</span>
                          <span className={styles.checkboxDescription}>
                            Allow other operators to view your profile and statistics.
                          </span>
                        </span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={showDiscordStatus}
                          onChange={(e) => setShowDiscordStatus(e.target.checked)}
                        />
                        <span className={styles.checkboxText}>
                          <span className={styles.checkboxTitle}>show discord status</span>
                          <span className={styles.checkboxDescription}>
                            Display your Discord presence, avatar, and activity on your profile.
                          </span>
                        </span>
                      </label>
                    </div>
                    <button type="submit" disabled={saving}>
                      {saving ? 'saving...' : 'save profile →'}
                    </button>
                  </form>
                </section>
              )}

              {activeTab === 'notifications' && (
                <section className={styles.section}>
                  <h2>notifications</h2>
                  <p className={styles.sectionDescription}>
                    Control how and when you receive alerts from the platform.
                  </p>
                  <form onSubmit={handleSaveSettings}>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                        />
                        <span className={styles.checkboxText}>
                          <span className={styles.checkboxTitle}>email notifications</span>
                          <span className={styles.checkboxDescription}>
                            Receive email alerts for first bloods, team invites, and event updates.
                          </span>
                        </span>
                      </label>
                    </div>
                    <button type="submit" disabled={saving}>
                      {saving ? 'saving...' : 'save notifications →'}
                    </button>
                  </form>
                </section>
              )}

              {activeTab === 'security' && (
                <section className={styles.section}>
                  <h2>security</h2>
                  <p className={styles.sectionDescription}>
                    Manage your authentication credentials and session security.
                  </p>
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
                        placeholder="Enter your current 6-digit PIN"
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
                        placeholder="Enter a new 6-digit PIN"
                      />
                    </div>
                    <button type="submit" disabled={changingPin}>
                      {changingPin ? 'updating...' : 'change pin →'}
                    </button>
                  </form>
                </section>
              )}

              {activeTab === 'quick-links' && (
                <section className={styles.section}>
                  <h2>quick links</h2>
                  <p className={styles.sectionDescription}>
                    Jump to related sections of the platform.
                  </p>
                  <nav className={styles.linkList}>
                    <Link href="/submissions" className={styles.link}>
                      submission history ↗
                    </Link>
                    <Link href="/notifications" className={styles.link}>
                      notifications ↗
                    </Link>
                  </nav>
                </section>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
