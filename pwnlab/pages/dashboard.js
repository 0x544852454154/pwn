import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { SkeletonStats, SkeletonTable, SkeletonList } from '../components/Skeleton';
import styles from '../styles/Dashboard.module.css';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch('/api/users/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.kicker}>operator console / overview</div>
            <h1>dashboard</h1>
          </div>
          <SkeletonStats count={6} />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>pwnlab · dashboard</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.kicker}>operator console / overview</div>
            <h1>dashboard</h1>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          <section className={styles.statsGrid}>
            <article className={styles.statBox}>
              <h3>challenges completed</h3>
              <p className={styles.statValue}>{stats?.stats.challengesCompleted || 0}</p>
            </article>

            <article className={styles.statBox}>
              <h3>ctf points</h3>
              <p className={styles.statValue}>{stats?.stats.ctfPoints || 0}</p>
            </article>

            <article className={styles.statBox}>
              <h3>success rate</h3>
              <p className={styles.statValue}>{stats?.stats.successRate || 0}%</p>
            </article>

            <article className={styles.statBox}>
              <h3>global rank</h3>
              <p className={styles.statValue}>#{stats?.stats.rank || 0}</p>
            </article>

            <article className={styles.statBox}>
              <h3>current streak</h3>
              <p className={styles.statValue}>{stats?.stats.currentStreak || 0}</p>
            </article>

            <article className={styles.statBox}>
              <h3>longest streak</h3>
              <p className={styles.statValue}>{stats?.stats.longestStreak || 0}</p>
            </article>
          </section>

          <div className={styles.gridLayout}>
            <section className={styles.mainCol}>
              <article className={styles.section}>
                <h2>challenges by category</h2>

                <div className={styles.categoryList}>
                  {stats?.byCategory && stats.byCategory.length > 0 ? (
                    stats.byCategory.map((cat) => (
                      <div key={cat.category} className={styles.categoryItem}>
                        <div className={styles.catHeader}>
                          <span className={styles.catName}>{cat.category || 'UNCATEGORIZED'}</span>
                          <span className={styles.catProgress}>
                            {cat.completed} / {cat.total}
                          </span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: `${(cat.completed / Math.max(cat.total, 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.empty}>No categories available.</p>
                  )}
                </div>
              </article>

              <article className={styles.section}>
                <h2>recent completions</h2>

                {stats?.recentChallenges && stats.recentChallenges.length > 0 ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>challenge</th>
                        <th>difficulty</th>
                        <th>points</th>
                        <th>completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentChallenges.map((challenge) => (
                        <tr key={challenge.id}>
                          <td>
                            <Link href={`/challenge/${challenge.id}`} className={styles.challengeLink}>
                              {challenge.name}
                            </Link>
                          </td>
                          <td>
                            <span className={styles.difficulty}>
                              {challenge.difficulty}
                            </span>
                          </td>
                          <td className={styles.pointsCell}>{challenge.points} pts</td>
                          <td className={styles.date}>
                            {new Date(challenge.completed_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.empty}>No completions yet.</p>
                )}
              </article>
            </section>

            <aside className={styles.sidebar}>
              <article className={styles.section}>
                <h2>quick navigation</h2>

                <nav className={styles.linkList}>
                  <Link href="/challenges" className={styles.link}>
                    challenges catalog ↗
                  </Link>
                  <Link href="/leaderboard" className={styles.link}>
                    global leaderboard ↗
                  </Link>
                  <Link href="/teams" className={styles.link}>
                    teams &amp; alliances ↗
                  </Link>
                  <Link href="/notes" className={styles.link}>
                    lab notes ↗
                  </Link>
                  <Link href="/activity" className={styles.link}>
                    activity stream ↗
                  </Link>
                  <Link href="/profile" className={styles.link}>
                    operator profile ↗
                  </Link>
                </nav>
              </article>

              <article className={styles.section}>
                <h2>submission metrics</h2>

                <dl className={styles.statsList}>
                  <dt>Accuracy</dt>
                  <dd>
                    {stats?.stats.submissionsCorrect || 0}/{stats?.stats.submissionsTotal || 0}
                  </dd>

                  <dt>Avg Solve Time</dt>
                  <dd>{stats?.stats.averageSolveTime || 0}m</dd>
                </dl>
              </article>
            </aside>
          </div>
        </div>
      </Layout>
    </>
  );
}
