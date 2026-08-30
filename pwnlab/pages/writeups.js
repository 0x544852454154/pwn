import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { SkeletonList } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import styles from '../styles/Activity.module.css';

export default function WriteupsPage() {
  const [writeups, setWriteups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterChallengeId, setFilterChallengeId] = useState('');

  const fetchWriteups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      if (filterChallengeId) params.append('challengeId', filterChallengeId);
      const response = await fetch(`/api/writeups?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setWriteups(data.writeups);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError('Failed to load writeups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterChallengeId]);

  useEffect(() => {
    fetchWriteups();
  }, [fetchWriteups]);

  return (
    <>
      <Head>
        <title>pwnlab · writeups</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.kicker}>knowledge base / writeups</div>
            <h1>writeups</h1>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          <div className={styles.controls}>
            <div className={styles.filterGroup}>
              <label>filter by challenge</label>
              <input
                type="text"
                placeholder="challenge id..."
                value={filterChallengeId}
                onChange={(e) => {
                  setFilterChallengeId(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {loading ? (
            <SkeletonList items={5} />
          ) : writeups.length === 0 ? (
            <div className={styles.empty}>No writeups yet. Be the first to document a solution.</div>
          ) : (
            <>
              <div className={styles.writeupsList}>
                {writeups.map((w) => (
                  <article key={w.id} className={styles.writeupCard}>
                    <div className={styles.writeupHeader}>
                      <h3>{w.title}</h3>
                      <span className={styles.writeupDate}>
                        {new Date(w.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {w.challenge && (
                      <Link href={`/challenge/${w.challenge}`} className={styles.challengeLink}>
                        {w.challenge} →
                      </Link>
                    )}
                    <p className={styles.writeupPreview}>{w.content.substring(0, 200)}...</p>
                    <div className={styles.writeupMeta}>
                      <span className={styles.author}>by {w.author}</span>
                    </div>
                  </article>
                ))}
              </div>

              {pagination && pagination.pages > 1 && (
                <Pagination
                  page={pagination.page}
                  pages={pagination.pages}
                  onChange={(newPage) => setCurrentPage(newPage)}
                />
              )}
            </>
          )}
        </div>
      </Layout>
    </>
  );
}
