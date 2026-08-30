import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import styles from '../../../styles/Activity.module.css';

export default function ChallengeWriteupsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [writeups, setWriteups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWriteups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/writeups?challengeId=${id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setWriteups(data.writeups);
      setError('');
    } catch (err) {
      setError('Failed to load writeups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchWriteups();
  }, [id, fetchWriteups]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/writeups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: id, title, content }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create writeup');
      }
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
    <>
      <Head>
        <title>pwnlab · writeups</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link href={`/challenge/${id}`} className={styles.backLink}>
              ← back to challenge
            </Link>
            <h1>writeups</h1>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          <div className={styles.formSection}>
            <button
              className={styles.createBtn}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'cancel' : '+ add writeup'}
            </button>

            {showForm && (
              <form onSubmit={handleSubmit} className={styles.writeupForm}>
                <div className={styles.formGroup}>
                  <label>title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Writeup title..."
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Document your approach, tools used, and key findings..."
                    rows={8}
                    required
                  />
                </div>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'publishing...' : 'publish writeup →'}
                </button>
              </form>
            )}
          </div>

          {loading ? (
            <div className={styles.loading}>loading writeups...</div>
          ) : writeups.length === 0 ? (
            <div className={styles.empty}>No writeups for this challenge yet.</div>
          ) : (
            <div className={styles.writeupsList}>
              {writeups.map((w) => (
                <article key={w.id} className={styles.writeupCard}>
                  <div className={styles.writeupHeader}>
                    <h3>{w.title}</h3>
                    <span className={styles.writeupDate}>
                      {new Date(w.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={styles.writeupPreview}>{w.content}</p>
                  <div className={styles.writeupMeta}>
                    <span className={styles.author}>by {w.author}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
