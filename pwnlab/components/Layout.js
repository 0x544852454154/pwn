import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './Layout.module.css';

function NavIcon({ name }) {
  const icons = {
    dashboard: 'M3 3v2h2V3H3zm16 0h-2v2h2zM3 7v2h2V7H3zm16 0h-2v2h2zM3 11v2h2v-2H3zm16 0h-2v2h2zM3 15v2h2v-2H3zm2 0v-2h2v2H5zm14-2h-2v2h2zm-4 0v2h-2v-2h2zm4 4v2h-2v-2h2zm-4 0v2h-4v-2h2v-2H9v2zm2-6V7h-2v2h2zm0 4h-2v-2h2v2z',
    challenges: 'M12 2L4 5v6c0 5 4 9 8 10 1.82-.56 3.44-1.5 4.66-2.66L12 10l4-2V5c0-1.1-.9-2-2-2h-2zM7 14c-2.36 2.54-3.66 5.7-3.66 9h7.32c-.34-.86-.58-1.76-.66-2.68-.08-.92.05-1.85.34-2.73L7 14z',
    leaderboard: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27z',
    teams: 'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 9.3 12 9.3zm0 2.4c-3.2 0-5.8 2.6-5.8 5.8v2.4h11.6v-2.4c0-3.2-2.6-5.8-5.8-5.8z',
    notes: 'M13 3a2 2 0 0 0-4 0v2h4V3zm-6 9a6 6 0 1 1 12 0v5a2 2 0 0 1-2 2h-1.5a.5.5 0 0 0-.5.5 1.5 1.5 0 1 1-3 0 .5.5 0 0 0-.5-.5H7a2 2 0 0 1-2-2V12z',
    writeups: 'M4 4h16v2H4V4zm0 6h16v2H4v-2zm0 6h10v2H4v-2z',
    activity: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15H7v-6h3v6zm5-9.5h-3V15h-2V7h5v4.5z',
    events: 'M9 2h6v2H9zM4 7h16v2H4zM7 11h2v8H7zm6 0h2v8h-2z',
    settings: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z',
    logout: 'M5 3h2v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h2v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H7V7c0-1.1-.9-2-2-2H5zm7 0h2v2h-2V3zm-4 4h10v12H8V7zm-2 2v10c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1z'
  };
  const path = icons[name] || '';
  return path ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.7"><path d={path} /></svg> : null;
}

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
        <div className={styles.loading}>
          <div className={styles.loadingTriangle}>
            <div className={styles.triangle}></div>
            <div className={styles.triangle2}></div>
            <div className={styles.triangle3}></div>
            <span className={styles.loadingText}>initializing...</span>
          </div>
        </div>
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
          <div className={styles.navLeft}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandMark}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.8"/>
                  <path d="M3 8l9 8 9-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 12l5 4 5-4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="10" r="1" fill="currentColor" opacity="0.6"/>
                  <circle cx="16" cy="10" r="1" fill="currentColor" opacity="0.6"/>
                </svg>
              </span>
              <span>pwnlab</span>
              <span>/ {sectionName}</span>
            </Link>

            {user ? (
              <>
                <nav className={styles.navLinks}>
                  <Link
                    href="/dashboard"
                    className={router.pathname === '/dashboard' ? styles.navLink + ' ' + styles.active : styles.navLink}
                  >
                    <NavIcon name="dashboard" />
                    dashboard
                  </Link>
                  <Link
                    href="/challenges"
                    className={router.pathname.startsWith('/challenge') ? styles.navLink + ' ' + styles.active : styles.navLink}
                  >
                    <NavIcon name="challenges" />
                    challenges
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={router.pathname === '/leaderboard' ? styles.navLink + ' ' + styles.active : styles.navLink}
                  >
                    <NavIcon name="leaderboard" />
                    leaderboard
                  </Link>
                  <Link
                    href="/teams"
                    className={router.pathname.startsWith('/team') ? styles.navLink + ' ' + styles.active : styles.navLink}
                  >
                    <NavIcon name="teams" />
                    teams
                  </Link>
                  <Link
                    href="/events"
                    className={router.pathname.startsWith('/events') ? styles.navLink + ' ' + styles.active : styles.navLink}
                  >
                    <NavIcon name="events" />
                    events
                  </Link>
                  <Link
                    href="/notes"
                    className={router.pathname === '/notes' ? styles.navLink + ' ' + styles.active : styles.navLink}
                  >
                    <NavIcon name="notes" />
                    notes
                  </Link>
                  <Link
                    href="/writeups"
                    className={router.pathname.startsWith('/writeups') ? styles.navLink + ' ' + styles.active : styles.navLink}
                  >
                    <NavIcon name="writeups" />
                    writeups
                  </Link>
                  <Link
                    href="/activity"
                    className={router.pathname === '/activity' ? styles.navLink + ' ' + styles.active : styles.navLink}
                  >
                    <NavIcon name="activity" />
                    activity
                  </Link>
                </nav>
              </>
            ) : null}
          </div>

          {user ? (
            <div className={styles.navRight}>
              <NotificationBell />
              <Link href="/profile" className={styles.userAvatar}>
                <span className={styles.avatarInitial}>
                  {user.username?.substring(0, 1).toUpperCase() || '•'}
                </span>
                <span className={styles.usernameText}>{user.username}</span>
              </Link>
              <Link href="/settings" className={styles.navLink}>
                <NavIcon name="settings" />
                settings
              </Link>
              <button
                onClick={handleLogout}
                className={styles.logoutBtn}
                aria-label="Logout"
              >
                <NavIcon name="logout" />
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
