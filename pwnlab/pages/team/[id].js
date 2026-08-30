import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from '../../styles/TeamDetail.module.css';

export default function TeamDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTeam = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/teams/${id}`);
      if (!response.ok) throw new Error('Team not found');
      const data = await response.json();
      setTeam(data.team);
      setError('');
    } catch (err) {
      setError('Failed to load team');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchTeam();
    }
  }, [id, fetchTeam]);

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.loading}>loading team profile...</div>
      </Layout>
    );
  }

  if (error || !team) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.error}>
          [ERROR]
          <br />
          {error || 'Team not found'}
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{team.name} · pwnlab</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.topNavRow}>
            <Link href="/teams" className={styles.backLink}>
              ← back to teams
            </Link>
          </div>

          <div className={styles.header}>
            <div>
              <div className={styles.kicker}>alliance profile / team #{team.id}</div>
              <h1>{team.name}</h1>
            </div>
            {team.isMember && (
              <span className={styles.memberBadge}>your team</span>
            )}
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>founder</span>
              <span className={styles.statValue}>{team.owner_username}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>members</span>
              <span className={styles.statValue}>{team.members.length}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>team score</span>
              <span className={styles.statValue}>{team.totalPoints} pts</span>
            </div>
          </div>

          <section className={styles.membersSection}>
            <h2>active operators</h2>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>operator</th>
                  <th>role</th>
                  <th className={styles.thPoints}>points</th>
                  <th className={styles.thJoined}>joined</th>
                </tr>
              </thead>
              <tbody>
                {team.members.map((member) => (
                  <tr key={member.id}>
                    <td className={styles.username}>
                      <Link href={`/profile?user=${encodeURIComponent(member.username)}`} className={styles.userLink}>
                        {member.username}
                      </Link>
                    </td>
                    <td>
                      <span className={styles.role}>{member.role}</span>
                    </td>
                    <td className={styles.points}>{member.points} pts</td>
                    <td className={styles.date}>
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </Layout>
    </>
  );
}
