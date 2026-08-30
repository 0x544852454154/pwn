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

          <div className={styles.contentGrid}>
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
