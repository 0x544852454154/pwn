import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/Layout';
import styles from '../styles/Leaderboard.module.css';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setLeaderboard(data.leaderboard);
      setError('');
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  async function handleToggleFriend(username, currentIsFriend) {
    if (!username) return;
    setActionLoading((prev) => ({ ...prev, [username]: true }));

    try {
      const response = await fetch('/api/users/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUsername: username,
          action: currentIsFriend ? 'remove' : 'add',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard((prev) =>
          prev.map((item) =>
            item.username.toLowerCase() === username.toLowerCase()
              ? { ...item, isFriend: data.isFriend }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle friend:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [username]: false }));
    }
  }

  return (
    <>
      <Head>
        <title>pwnlab · global standings & operator dossier</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.kicker}>rankings / global standings</div>
            <h1>leaderboard</h1>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>loading global standings...</div>
          ) : leaderboard.length === 0 ? (
            <div className={styles.empty}>No entries on leaderboard yet.</div>
          ) : (
            <div className={styles.leaderboardBox}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>rank</th>
                    <th>operator</th>
                    <th className={styles.thPoints}>points</th>
                    <th className={styles.thSolves}>solves</th>
                    <th className={styles.thActions}>actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => {
                    const isTopThree = entry.rank <= 3;
                    const statusDotClass = entry.status
                      ? styles[`status_${entry.status}`]
                      : styles.status_offline;

                    return (
                      <tr key={entry.id} className={isTopThree ? styles.topRank : ''}>
                        <td className={styles.rankCell}>
                          <span className={isTopThree ? styles.topRankBadge : styles.rankNumber}>
                            #{entry.rank}
                          </span>
                        </td>
                        <td className={styles.usernameCell}>
                          <div className={styles.operatorContainer}>
                            <div className={styles.avatarWrapper}>
                              {entry.avatarUrl ? (
                                <Image
                                  src={entry.avatarUrl}
                                  alt={entry.username}
                                  width={36}
                                  height={36}
                                  unoptimized
                                  className={styles.avatarImg}
                                />
                              ) : (
                                <div className={styles.avatarPlaceholder}>
                                  {entry.username.substring(0, 1).toUpperCase()}
                                </div>
                              )}
                              <span
                                className={`${styles.statusDot} ${statusDotClass}`}
                                title={`Discord Status: ${entry.status || 'offline'}`}
                              />
                            </div>

                            <div className={styles.operatorDetails}>
                              <Link
                                href={`/profile?user=${encodeURIComponent(entry.username)}`}
                                className={styles.userLink}
                              >
                                {entry.username}
                              </Link>
                              {entry.discord_username && (
                                <span className={styles.discordHandle}>
                                  @{entry.discord_username}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={styles.pointsCell}>{entry.total_points} pts</td>
                        <td className={styles.challengesCell}>{entry.challenges_completed}</td>
                        <td className={styles.actionsCell}>
                          <div className={styles.actionButtonGroup}>
                            <Link
                              href={`/profile?user=${encodeURIComponent(entry.username)}`}
                              className={styles.stalkBtn}
                              title="Stalk / View Operator Dossier"
                            >
                              stalk dossier ↗
                            </Link>

                            {!entry.isSelf && (
                              <button
                                type="button"
                                disabled={actionLoading[entry.username]}
                                onClick={() => handleToggleFriend(entry.username, entry.isFriend)}
                                className={
                                  entry.isFriend ? styles.friendBtnActive : styles.friendBtn
                                }
                                title={
                                  entry.isFriend
                                    ? 'Remove from Friends'
                                    : 'Add to Friends & Stalk List'
                                }
                              >
                                {actionLoading[entry.username]
                                  ? '...'
                                  : entry.isFriend
                                  ? '★ friended'
                                  : '+ add friend'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
