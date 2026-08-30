import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Activity.module.css';

const ACTION_LABELS = {
  CHALLENGE_COMPLETED: 'solved a security challenge',
  TEAM_JOINED: 'joined an alliance',
  TEAM_CREATED: 'formed a new alliance',
  MACHINE_STARTED: 'provisioned a target container',
};

export default function ActivityPage() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActivity();
  }, []);

  async function fetchActivity() {
    try {
      const response = await fetch('/api/activity');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setActivity(data.activity);
      setError('');
    } catch (err) {
      setError('Failed to load activity');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <>
      <Head>
        <title>pwnlab · activity</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.kicker}>audit stream / activity</div>
            <h1>activity</h1>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>loading activity stream...</div>
          ) : activity.length === 0 ? (
            <div className={styles.empty}>No platform events recorded yet.</div>
          ) : (
            <div className={styles.feed}>
              {activity.map((item) => (
                <div key={item.id} className={styles.feedItem}>
                  <span className={styles.time}>{formatTime(item.created_at)}</span>
                  <span className={styles.text}>
                    <Link href={`/profile?user=${encodeURIComponent(item.username)}`} className={styles.operatorLink}>
                      {item.username}
                    </Link>{' '}
                    {ACTION_LABELS[item.action] || item.action.toLowerCase().replace(/_/g, ' ')}
                  </span>
                  <span className={styles.date}>{formatDate(item.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
