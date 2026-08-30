import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './Layout.module.css';

export default function Layout({ children, requireAuth = false }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState(null);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        if (requireAuth) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      if (requireAuth) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [requireAuth, router]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        if (data.announcements && data.announcements.length > 0) {
          const latest = data.announcements[0];
          setAnnouncement(latest);
        }
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchAnnouncements();
  }, [checkAuth, fetchAnnouncements]);

  // Periodic announcement poll
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnnouncements();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  function getSectionName() {
    const path = router.pathname;
    if (path === '/') return 'about';
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/challenge/')) return 'challenge';
    if (path.startsWith('/challenges')) return 'challenges';
    if (path.startsWith('/leaderboard')) return 'leaderboard';
    if (path.startsWith('/team/')) return 'team';
    if (path.startsWith('/teams')) return 'teams';
    if (path.startsWith('/notes')) return 'notes';
    if (path.startsWith('/activity')) return 'activity';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/user/')) return 'operator';
    if (path.startsWith('/login')) return 'login';
    if (path.startsWith('/submissions')) return 'submissions';
    if (path.startsWith('/writeups')) return 'writeups';
    if (path.startsWith('/events')) return 'events';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/notifications')) return 'notifications';
    return path.replace(/^\//, '') || 'about';
  }

  if (requireAuth && loading) {
    return (
      <div className={styles.layout}>
        <div className={styles.loading}>initializing...</div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  const sectionName = getSectionName();
  const showBanner = announcement && !dismissedAnnouncements.includes(announcement.id);

  return (
    <div className={styles.layout}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>p</span>
            <span>pwnlab</span>
            <span>/ {sectionName}</span>
          </Link>

          {user ? (
            <div className={styles.navRight}>
              <Link
                href="/dashboard"
                className={router.pathname === '/dashboard' ? styles.navLink + ' ' + styles.active : styles.navLink}
              >
                dashboard
              </Link>
              <Link
                href="/challenges"
                className={router.pathname.startsWith('/challenge') ? styles.navLink + ' ' + styles.active : styles.navLink}
              >
                challenges
              </Link>
              <Link
                href="/leaderboard"
                className={router.pathname === '/leaderboard' ? styles.navLink + ' ' + styles.active : styles.navLink}
              >
                leaderboard
              </Link>
              <Link
                href="/teams"
                className={router.pathname.startsWith('/team') ? styles.navLink + ' ' + styles.active : styles.navLink}
              >
                teams
              </Link>
              <Link
                href="/events"
                className={router.pathname.startsWith('/events') ? styles.navLink + ' ' + styles.active : styles.navLink}
              >
                events
              </Link>
              <Link
                href="/notes"
                className={router.pathname === '/notes' ? styles.navLink + ' ' + styles.active : styles.navLink}
              >
                notes
              </Link>
              <Link
                href="/writeups"
                className={router.pathname.startsWith('/writeups') ? styles.navLink + ' ' + styles.active : styles.navLink}
              >
                writeups
              </Link>
              <Link
                href="/activity"
                className={router.pathname === '/activity' ? styles.navLink + ' ' + styles.active : styles.navLink}
              >
                activity
              </Link>
              <NotificationBell />
              <Link href="/profile" className={styles.username}>
                {user.username}
              </Link>
              <Link href="/settings" className={styles.navLink}>
                settings
              </Link>
              <button
                onClick={handleLogout}
                className={styles.logoutBtn}
                aria-label="Logout"
              >
                logout
              </button>
            </div>
          ) : (
            <div className={styles.navRight}>
              <div className={styles.status}>
                <i></i>
                system in development
              </div>
              <Link href="/login" className={styles.loginLink}>
                login
              </Link>
            </div>
          )}
        </header>

        {/* Global Announcement / First Blood Banner */}
        {showBanner && (
          <div className={styles.announcementBanner}>
            <div className={styles.announcementContent}>
              <span className={styles.announcementBadge}>
                {announcement.isFirstBlood ? 'FIRST BLOOD 🩸' : 'BROADCAST'}
              </span>
              <span>{announcement.details}</span>
            </div>
            <button
              type="button"
              onClick={() => setDismissedAnnouncements((prev) => [...prev, announcement.id])}
              className={styles.announcementDismiss}
              aria-label="Dismiss announcement"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <main className={styles.main}>{children}</main>

        <footer className={styles.footer}>
          <div className={styles.footerNote}>pwnlab // authorized learning only</div>
          <a
            href="https://discord.gg/4rX2C8A98"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.discordLink}
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                fill="currentColor"
              />
            </svg>
            <span>discord</span>
          </a>
        </footer>
      </div>
    </div>
  );
}

function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  async function fetchNotifications() {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications.slice(0, 10));
        setUnreadCount(data.notifications.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }

  async function handleMarkRead(id) {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'readAll' })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }

  if (!user) return null;

  return (
    <div className={styles.notifWrapper}>
      <button
        type="button"
        className={styles.notifBell}
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.notifDropdown}>
          <div className={styles.notifHeader}>
            <span>notifications</span>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className={styles.notifMarkAll}>
                mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className={styles.notifEmpty}>No notifications</div>
          ) : (
            <div className={styles.notifList}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`${styles.notifItem} ${n.isRead ? '' : styles.notifUnread}`}
                  onClick={() => handleMarkRead(n.id)}
                >
                  <div className={styles.notifTitle}>{n.title}</div>
                  {n.message && <div className={styles.notifMessage}>{n.message}</div>}
                  <div className={styles.notifTime}>
                    {new Date(n.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
