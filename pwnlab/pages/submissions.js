import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { SkeletonTable } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import styles from '../styles/Activity.module.css';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/submissions?page=${currentPage}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSubmissions(data.submissions);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError('Failed to load submissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return (
    <>
      <Head>
        <title>pwnlab · submission history</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.kicker}>operator log / submissions</div>
            <h1>submission history</h1>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          {loading ? (
            <SkeletonTable rows={6} cols={4} />
          ) : submissions.length === 0 ? (
            <div className={styles.empty}>No submissions yet. Start solving challenges.</div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>challenge</th>
                    <th>flag submitted</th>
                    <th>result</th>
                    <th>submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        {s.challenge ? (
                          <Link href={`/challenge/${s.challenge.id}`} className={styles.operatorLink}>
                            {s.challenge.name}
                          </Link>
                        ) : (
                          <span>Unknown Challenge</span>
                        )}
                      </td>
                      <td className={styles.flagCell}>{s.flag}</td>
                      <td>
                        <span className={s.is_correct ? styles.successBadge : styles.failBadge}>
                          {s.is_correct ? 'correct' : 'incorrect'}
                        </span>
                      </td>
                      <td className={styles.date}>
                        {new Date(s.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
