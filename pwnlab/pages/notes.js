import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Notes.module.css';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const response = await fetch('/api/notes');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setNotes(data.notes);
      setError('');
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function preview(content) {
    if (!content) return 'Empty note.';
    const stripped = content.replace(/[#*`_>-]/g, '').trim();
    return stripped.length > 140 ? stripped.slice(0, 140) + '...' : stripped;
  }

  return (
    <>
      <Head>
        <title>Notes - pwnlab</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.breadcrumb}>notes</p>
            <h1>pwnlab</h1>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>LOADING NOTES...</div>
          ) : notes.length === 0 ? (
            <div className={styles.empty}>
              No notes yet. Open a challenge and start taking notes.
            </div>
          ) : (
            <div className={styles.notesList}>
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/challenge/${note.challenge_id}`}
                  className={styles.noteCard}
                >
                  <div className={styles.noteHeader}>
                    <h3>{note.challenge_name || 'UNTITLED CHALLENGE'}</h3>
                    <span className={styles.date}>
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={styles.notePreview}>{preview(note.content)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
