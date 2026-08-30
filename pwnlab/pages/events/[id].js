import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from '../../styles/TeamDetail.module.css';

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    try {
      const [eventRes, partRes] = await Promise.all([
        fetch(`/api/events/${id}`),
        fetch(`/api/events/${id}/participants`)
      ]);

      if (!eventRes.ok) throw new Error('Failed to fetch event');
      const eventData = await eventRes.json();
      setEvent(eventData.event);

      if (partRes.ok) {
        const partData = await partRes.json();
        setParticipants(partData.participants);
      }
      setError('');
    } catch (err) {
      setError('Failed to load event');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id, fetchEvent]);

  async function handleJoin() {
    setJoining(true);
    try {
      const response = await fetch(`/api/events/${id}/join`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      fetchEvent();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.loading}>loading event...</div>
      </Layout>
    );
  }

  if (error || !event) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.error}>
          [ERROR]
          <br />
          {error || 'Event not found'}
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{event.name} · pwnlab</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.topNavRow}>
            <Link href="/events" className={styles.backLink}>
              ← back to events
            </Link>
          </div>

          <div className={styles.header}>
            <div>
              <div className={styles.kicker}>event #{event.id}</div>
              <h1>{event.name}</h1>
            </div>
            {!event.isParticipant && event.status === 'SCHEDULED' && (
              <button
                className={styles.joinBtn}
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? 'joining...' : 'join event'}
              </button>
            )}
            {event.isParticipant && (
              <span className={styles.memberBadge}>joined</span>
            )}
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>mode</span>
              <span className={styles.statValue}>{event.mode}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>status</span>
              <span className={styles.statValue}>{event.status}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>participants</span>
              <span className={styles.statValue}>{participants.length}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>creator</span>
              <span className={styles.statValue}>{event.creator}</span>
            </div>
          </div>

          {event.description && (
            <div className={styles.section}>
              <h2>description</h2>
              <p>{event.description}</p>
            </div>
          )}

          <section className={styles.membersSection}>
            <h2>leaderboard</h2>
            {participants.length === 0 ? (
              <p className={styles.empty}>No participants yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>rank</th>
                    <th>operator</th>
                    <th>team</th>
                    <th className={styles.thPoints}>points</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id}>
                      <td className={styles.rankCell}>#{p.rank}</td>
                      <td className={styles.username}>
                        <Link href={`/profile?user=${encodeURIComponent(p.user)}`} className={styles.userLink}>
                          {p.user}
                        </Link>
                      </td>
                      <td>{p.team || '-'}</td>
                      <td className={styles.points}>{p.points} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </Layout>
    </>
  );
}
