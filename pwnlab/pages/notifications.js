import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Activity.module.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setNotifications(data.notifications);
      setError('');
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id) {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'readAll' })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <Head>
        <title>pwnlab · notifications</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.kicker}>operator alerts / notifications</div>
            <div className={styles.headerRow}>
              <h1>notifications</h1>
              {unreadCount > 0 && (
                <button className={styles.markAllBtn} onClick={markAllAsRead}>
                  mark all read ({unreadCount})
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className={styles.empty}>No notifications yet.</div>
          ) : (
            <div className={styles.feed}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.feedItem} ${n.isRead ? '' : styles.unread}`}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                >
                  <span className={styles.time}>
                    {new Date(n.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                  <span className={styles.text}>
                    <strong>{n.title}</strong>
                    {n.message && <span className={styles.notifMessage}> — {n.message}</span>}
                  </span>
                  <span className={styles.date}>
                    {new Date(n.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
