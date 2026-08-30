import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Challenges.module.css';

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'INSANE'];
const CATEGORIES = [
  'LINUX',
  'NETWORKING',
  'WEB',
  'CRYPTOGRAPHY',
  'FORENSICS',
  'OSINT',
  'REVERSE ENGINEERING',
  'BINARY EXPLOITATION',
  'PRIVILEGE ESCALATION',
  'ACTIVE DIRECTORY',
  'API SECURITY',
  'STEGANOGRAPHY',
  'MALWARE ANALYSIS',
];

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('page', currentPage);

      const response = await fetch(`/api/challenges?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setChallenges(data.challenges);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError('Failed to load challenges');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedDifficulty, selectedStatus, currentPage]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setCurrentPage(1);
  }

  return (
    <>
      <Head>
        <title>pwnlab · challenges</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.kicker}>security catalog / challenges</div>
            <h1>challenges</h1>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          <div className={styles.controlsGrid}>
            <aside className={styles.filterPanel}>
              <h3>filters</h3>

              <div className={styles.filterGroup}>
                <label>search</label>
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Filter challenges..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </form>
              </div>

              <div className={styles.filterGroup}>
                <label>difficulty</label>
                <div className={styles.filterOptions}>
                  <button
                    className={!selectedDifficulty ? styles.active : ''}
                    onClick={() => {
                      setSelectedDifficulty('');
                      setCurrentPage(1);
                    }}
                  >
                    all
                  </button>
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      className={selectedDifficulty === d ? styles.active : ''}
                      onClick={() => {
                        setSelectedDifficulty(d);
                        setCurrentPage(1);
                      }}
                    >
                      {d.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label>category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">ALL CATEGORIES</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">ALL STATUSES</option>
                  <option value="completed">COMPLETED</option>
                  <option value="not-completed">NOT COMPLETED</option>
                </select>
              </div>
            </aside>

            <section className={styles.challengesList}>
              {loading ? (
                <div className={styles.loading}>loading challenges...</div>
              ) : challenges.length === 0 ? (
                <div className={styles.empty}>No challenges match the active filters.</div>
              ) : (
                <>
                  <div className={styles.challengesGrid}>
                    {challenges.map((challenge, idx) => {
                      const radiusClass =
                        idx % 4 === 0
                          ? styles.cardA
                          : idx % 4 === 1
                          ? styles.cardB
                          : idx % 4 === 2
                          ? styles.cardC
                          : styles.cardD;

                      return (
                        <article key={challenge.id} className={`${styles.challengeCard} ${radiusClass}`}>
                          <div className={styles.cardHeader}>
                            <h3>{challenge.name}</h3>
                            {challenge.is_completed && (
                              <span className={styles.completedBadge}>completed</span>
                            )}
                          </div>

                          <div className={styles.cardMeta}>
                            <span className={styles.category}>{challenge.category}</span>
                            <span className={styles.points}>{challenge.points} pts</span>
                          </div>

                          <div className={styles.cardDetails}>
                            <div className={styles.detail}>
                              <span className={styles.detailLabel}>difficulty</span>
                              <span className={styles.detailValue}>{challenge.difficulty}</span>
                            </div>
                            <div className={styles.detail}>
                              <span className={styles.detailLabel}>est. time</span>
                              <span className={styles.detailValue}>{challenge.estimated_time}m</span>
                            </div>
                            <div className={styles.detail}>
                              <span className={styles.detailLabel}>solves</span>
                              <span className={styles.detailValue}>{challenge.solves}</span>
                            </div>
                          </div>

                          <p className={styles.description}>
                            {challenge.description}
                          </p>

                          <Link
                            href={`/challenge/${challenge.id}`}
                            className={styles.viewBtn}
                          >
                            view challenge →
                          </Link>
                        </article>
                      );
                    })}
                  </div>

                  {pagination && pagination.pages > 1 && (
                    <div className={styles.pagination}>
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        ← previous
                      </button>

                      <span className={styles.pageInfo}>
                        page {pagination.page} of {pagination.pages}
                      </span>

                      <button
                        disabled={currentPage === pagination.pages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
}
