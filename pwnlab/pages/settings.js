import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Settings.module.css';

const SECTIONS = [
  {
    id: 'profile',
    label: 'profile',
    description: 'Your public profile and visibility settings',
  },
  {
    id: 'notifications',
    label: 'notifications',
    description: 'Email and push notification preferences',
  },
  {
    id: 'security',
    label: 'security',
    description: 'PIN, password, and session management',
  },
  {
    id: 'quick-links',
    label: 'quick links',
    description: 'Jump to other platform sections',
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [openSection, setOpenSection] = useState('profile');

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
            <h1>settings</h1>
          </div>

          {error && (
            <div className={styles.alertError}>
              {error}
            </div>
          )}

          {message && (
            <div className={styles.alertSuccess}>{message}</div>
          )}

          <div className={styles.accordion}>
            {SECTIONS.map((section) => {
              const isOpen = openSection === section.id;
              return (
                <div key={section.id} className={styles.item}>
                  <button
                    type="button"
                    className={styles.itemHeader}
                    onClick={() => setOpenSection(isOpen ? null : section.id)}
                    aria-expanded={isOpen}
                  >
                    <div className={styles.itemHeaderText}>
                      <span className={styles.itemLabel}>{section.label}</span>
                      <span className={styles.itemDescription}>{section.description}</span>
                    </div>
                    <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>⌄</span>
                  </button>

                  {isOpen && (
                    <div className={styles.itemBody}>
                      {section.id === 'profile' && (
                        <form onSubmit={handleSaveSettings}>
                          <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="bio">bio</label>
                            <textarea
                              id="bio"
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              maxLength={500}
                              rows={3}
                              className={styles.textarea}
                              placeholder="Tell other operators about yourself..."
                            />
                          </div>

                          <div className={styles.rows}>
                            <label className={styles.row}>
                              <input
                                type="checkbox"
                                className={styles.toggle}
                                checked={publicProfile}
                                onChange={(e) => setPublicProfile(e.target.checked)}
                              />
                              <span className={styles.rowText}>
                                <span className={styles.rowTitle}>public profile</span>
                                <span className={styles.rowDescription}>
                                  Let others see your profile and stats
                                </span>
                              </span>
                            </label>

                            <label className={styles.row}>
                              <input
                                type="checkbox"
                                className={styles.toggle}
                                checked={showDiscordStatus}
                                onChange={(e) => setShowDiscordStatus(e.target.checked)}
                              />
                              <span className={styles.rowText}>
                                <span className={styles.rowTitle}>show discord status</span>
                                <span className={styles.rowDescription}>
                                  Display Discord avatar and presence
                                </span>
                              </span>
                            </label>
                          </div>

                          <button type="submit" disabled={saving} className={styles.primaryBtn}>
                            {saving ? 'saving...' : 'save changes'}
                          </button>
                        </form>
                      )}

                      {section.id === 'notifications' && (
                        <form onSubmit={handleSaveSettings}>
                          <div className={styles.rows}>
                            <label className={styles.row}>
                              <input
                                type="checkbox"
                                className={styles.toggle}
                                checked={emailNotifications}
                                onChange={(e) => setEmailNotifications(e.target.checked)}
                              />
                              <span className={styles.rowText}>
                                <span className={styles.rowTitle}>email notifications</span>
                                <span className={styles.rowDescription}>
                                  Alerts for first bloods, team invites, and events
                                </span>
                              </span>
                            </label>
                          </div>

                          <button type="submit" disabled={saving} className={styles.primaryBtn}>
                            {saving ? 'saving...' : 'save changes'}
                          </button>
                        </form>
                      )}

                      {section.id === 'security' && (
                        <form onSubmit={handleChangePin} className={styles.securityForm}>
                          {pinMessage && (
                            <div className={styles.alertSuccess}>{pinMessage}</div>
                          )}
                          {pinError && (
                            <div className={styles.alertError}>{pinError}</div>
                          )}

                          <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="currentPin">current pin</label>
                            <input
                              id="currentPin"
                              type="password"
                              value={currentPin}
                              onChange={(e) => setCurrentPin(e.target.value)}
                              maxLength={6}
                              pattern="\d{6}"
                              required
                              className={styles.input}
                              placeholder="Enter current 6-digit PIN"
                            />
                          </div>

                          <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="newPin">new pin</label>
                            <input
                              id="newPin"
                              type="password"
                              value={newPin}
                              onChange={(e) => setNewPin(e.target.value)}
                              maxLength={6}
                              pattern="\d{6}"
                              required
                              className={styles.input}
                              placeholder="Enter new 6-digit PIN"
                            />
                          </div>

                          <button type="submit" disabled={changingPin} className={styles.primaryBtn}>
                            {changingPin ? 'updating...' : 'update pin'}
                          </button>
                        </form>
                      )}

                      {section.id === 'quick-links' && (
                        <nav className={styles.links}>
                          <Link href="/submissions" className={styles.link}>
                            submission history
                            <span className={styles.linkArrow}>→</span>
                          </Link>
                          <Link href="/notifications" className={styles.link}>
                            notifications
                            <span className={styles.linkArrow}>→</span>
                          </Link>
                        </nav>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Layout>
    </>
  );
}
