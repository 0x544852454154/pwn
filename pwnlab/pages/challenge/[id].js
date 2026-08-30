import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from '../../styles/ChallengeDetail.module.css';

// Dynamically import xterm component without SSR
const ChallengeTerminal = dynamic(
  () => import('../../components/ChallengeTerminal'),
  { ssr: false }
);

export default function ChallengeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSavedAt, setNotesSavedAt] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [activeTab, setActiveTab] = useState('briefing');

  const fetchNote = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/notes/${id}`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.note) {
        setNotes(data.note.content || '');
      }
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  const fetchChallenge = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/challenges/${id}`);
      if (!response.ok) throw new Error('Challenge not found');
      const data = await response.json();
      setChallenge(data.challenge);
      setError('');
    } catch (err) {
      setError('Failed to load challenge');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchChallenge();
      fetchNote();
    }
  }, [id, fetchChallenge, fetchNote]);

  async function saveNotes(content) {
    if (!id) return;
    setNotesSaving(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: id, content }),
      });
      if (response.ok) {
        setNotesSavedAt(new Date());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNotesSaving(false);
    }
  }

  function handleNotesChange(e) {
    const value = e.target.value;
    setNotes(value);

    if (window.notesTimeout) clearTimeout(window.notesTimeout);
    window.notesTimeout = setTimeout(() => {
      saveNotes(value);
    }, 1000);
  }

  async function handleFlagSubmit(e) {
    e.preventDefault();
    if (!flag.trim() || !id) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/challenges/submit-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: id, flag }),
      });

      const data = await response.json();
      setSubmission(data);

      if (data.success) {
        setFlag('');
        fetchChallenge();
      }
    } catch (err) {
      setSubmission({ success: false, correct: false, message: 'Submission failed' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.loading}>loading challenge...</div>
      </Layout>
    );
  }

  if (error || !challenge) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.error}>
          [ERROR]
          <br />
          {error || 'Challenge not found'}
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{challenge.name} · pwnlab target</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.topNavRow}>
            <Link href="/challenges" className={styles.backLink}>
              ← back to challenges
            </Link>
          </div>

          <div className={styles.header}>
            <div>
              <div className={styles.kicker}>challenge / target #{challenge.id}</div>
              <h1>{challenge.name}</h1>
            </div>
            {challenge.is_completed && (
              <span className={styles.completedBadge}>completed</span>
            )}
          </div>

          <section className={styles.metaSection}>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.label}>category</span>
                <span className={styles.value}>{challenge.category}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.label}>difficulty</span>
                <span className={styles.value}>{challenge.difficulty}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.label}>points</span>
                <span className={styles.value}>{challenge.points} pts</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.label}>est. time</span>
                <span className={styles.value}>{challenge.estimated_time}m</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.label}>solves</span>
                <span className={styles.value}>{challenge.solves}</span>
              </div>
              {challenge.first_blood && (
                <div className={styles.metaItem}>
                  <span className={styles.label}>first blood</span>
                  <span className={`${styles.value} ${styles.firstBloodValue}`}>
                    {challenge.first_blood.username}
                  </span>
                  {challenge.first_blood.timestamp && (
                    <span className={styles.firstBloodTime}>
                      {new Date(challenge.first_blood.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons: Download and Web Terminal */}
              <div className={styles.metaActions}>
                <a
                  href={`/api/challenges/${id}/download`}
                  className={styles.downloadBtn}
                >
                  download files ↓
                </a>
                <button
                  type="button"
                  onClick={() => setShowTerminal((prev) => !prev)}
                  className={showTerminal ? styles.terminalToggleBtnActive : styles.terminalToggleBtn}
                >
                  {showTerminal ? 'close terminal ✕' : '>_ web terminal'}
                </button>
              </div>
            </div>
          </section>

          {/* Interactive xterm.js Web Terminal */}
          {showTerminal && (
            <ChallengeTerminal
              challengeId={challenge.id}
              challengeName={challenge.name}
              storagePath={challenge.storage_path}
              onClose={() => setShowTerminal(false)}
            />
          )}

          <div className={styles.tabs}>
            <button
              type="button"
              className={activeTab === 'briefing' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('briefing')}
            >
              briefing
            </button>
            <button
              type="button"
              className={activeTab === 'writeups' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('writeups')}
            >
              writeups
            </button>
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              className={activeTab === 'briefing' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('briefing')}
            >
              briefing
            </button>
            <button
              type="button"
              className={activeTab === 'writeups' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('writeups')}
            >
              writeups
            </button>
          </div>

          <div className={styles.contentGrid}>
            {activeTab === 'briefing' ? (
              <main className={styles.mainContent}>
                <section className={styles.section}>
                  <h2>briefing / description</h2>
                  <p className={styles.descriptionText}>{challenge.description}</p>
                </section>

                {challenge.objectives && challenge.objectives.length > 0 && (
                  <section className={styles.section}>
                    <h2>mission objectives</h2>
                    <ul className={styles.objectivesList}>
                      {challenge.objectives.map((obj, idx) => (
                        <li key={idx}>
                          <span className={styles.checkbox}>[ ]</span>
                          <span>{obj.objective}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className={styles.section}>
                  <h2>submit flag</h2>

                  {submission && (
                    <div
                      className={
                        submission.correct
                          ? styles.successMessage
                          : styles.errorMessage
                      }
                    >
                      <strong>
                        {submission.correct
                          ? submission.isFirstBlood
                            ? '🩸 [FIRST BLOOD!]'
                            : '[SOLVED]'
                          : submission.error === 'RATE_LIMITED'
                          ? '[RATE LIMITED]'
                          : '[REJECTED]'}
                      </strong>
                      <br />
                      {submission.message}
                      {submission.pointsEarned ? (
                        <span className={styles.pointsEarned}>
                          <br />+{submission.pointsEarned} points awarded
                        </span>
                      ) : null}
                    </div>
                  )}

                  <form onSubmit={handleFlagSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                      <input
                        type="text"
                        placeholder="pwnlab{...} or pwn{...}"
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                        disabled={submitting}
                        className={styles.flagInput}
                        required
                      />
                      <button
                        type="submit"
                        disabled={submitting || !flag.trim()}
                        className={styles.submitBtn}
                      >
                        {submitting ? 'verifying...' : 'submit →'}
                      </button>
                    </div>
                  </form>
                </section>
              </main>
            ) : (
              <main className={styles.mainContent}>
                <WriteupsTab challengeId={id} />
              </main>
            )}

            <aside className={styles.sidebar}>
              {challenge.hints && challenge.hints.length > 0 && (
                <section className={styles.section}>
                  <h2>intel &amp; hints</h2>
                  <ul className={styles.hintsList}>
                    {challenge.hints.map((hint, idx) => (
                      <li key={idx}>
                        <span className={styles.hintNum}>#{idx + 1}</span>
                        <p>{hint.hint_text}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className={styles.section}>
                <h2>lab notes</h2>
                <textarea
                  className={styles.notesTextarea}
                  placeholder="Record your observations, payload dumps, and decoding notes..."
                  value={notes}
                  onChange={handleNotesChange}
                />
                <span className={styles.notesStatus}>
                  {notesSaving
                    ? 'saving...'
                    : notesSavedAt
                    ? `Saved at ${notesSavedAt.toLocaleTimeString()}`
                    : 'Notes auto-save'}
                </span>
              </section>
            </aside>
          </div>
        </div>
      </Layout>
    </>
  );
}

function WriteupsTab({ challengeId }) {
  const [writeups, setWriteups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchWriteups = useCallback(async () => {
    try {
      const response = await fetch(`/api/writeups?challengeId=${challengeId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setWriteups(data.writeups);
      setError('');
    } catch (err) {
      setError('Failed to load writeups');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchWriteups();
  }, [fetchWriteups]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/writeups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, title, content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      setTitle('');
      setContent('');
      setShowForm(false);
      fetchWriteups();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5em' }}>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#121212',
            border: '1px solid #303030',
            color: '#cfcfcf',
            padding: '10px 14px',
            borderRadius: '13px 16px 12px 15px',
            font: '500 .62rem ui-monospace, monospace',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'cancel' : '+ add writeup'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '1em' }}>
            {error && (
              <div style={{ color: '#f44747', marginBottom: '1em' }}>
                [ERROR]<br />{error}
              </div>
            )}
            <div style={{ marginBottom: '1em' }}>
              <label style={{ display: 'block', color: '#666', fontSize: '.7rem', marginBottom: '.3em' }}>title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#0f0f0f',
                  border: '1px solid #2a2a2a',
                  color: '#e7e7e7',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div style={{ marginBottom: '1em' }}>
              <label style={{ display: 'block', color: '#666', fontSize: '.7rem', marginBottom: '.3em' }}>content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                required
                style={{
                  width: '100%',
                  background: '#0f0f0f',
                  border: '1px solid #2a2a2a',
                  color: '#e7e7e7',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            <button type="submit" disabled={submitting} style={{
              background: '#121212',
              border: '1px solid #303030',
              color: '#cfcfcf',
              padding: '10px 14px',
              borderRadius: '13px 16px 12px 15px',
              font: '500 .62rem ui-monospace, monospace',
              cursor: 'pointer'
            }}>
              {submitting ? 'publishing...' : 'publish writeup →'}
            </button>
          </form>
        )}
      </div>

      {loading ? (
        <div>loading writeups...</div>
      ) : writeups.length === 0 ? (
        <div style={{ color: '#666' }}>No writeups for this challenge yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
          {writeups.map((w) => (
            <div key={w.id} style={{
              background: '#101010',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              padding: '1em'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5em' }}>
                <h3 style={{ color: '#d6d6d6', fontSize: '.85rem', fontWeight: 600 }}>{w.title}</h3>
                <span style={{ color: '#555', fontSize: '.65rem', fontFamily: 'ui-monospace, monospace' }}>
                  {new Date(w.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ color: '#888', fontSize: '.8rem', lineHeight: 1.6, marginBottom: '.5em' }}>{w.content}</p>
              <span style={{ color: '#555', fontSize: '.65rem', fontFamily: 'ui-monospace, monospace' }}>by {w.author}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
