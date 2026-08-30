import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { SkeletonList } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import styles from '../styles/Teams.module.css';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('TEAM');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  async function fetchEvents() {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', currentPage);
      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setEvents(data.events);
      setPagination(data.pagination || null);
      setError('');
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, mode, startTime, endTime }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create event');
      setName('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setShowCreateForm(false);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(eventId) {
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to join');
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <>
      <Head>
        <title>pwnlab · events</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <div className={styles.kicker}>competitions / events</div>
              <h1>events</h1>
            </div>
            <button
              className={styles.createBtn}
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'cancel' : '+ create event'}
            </button>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          <div className={styles.searchRow}>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>

          {showCreateForm && (
            <div className={styles.createForm}>
              <h3>form new event</h3>
              <form onSubmit={handleCreate}>
                <div className={styles.formRow}>
                  <input
                    type="text"
                    placeholder="Event name (3-100 characters)..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={creating}
                    minLength={3}
                    maxLength={100}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <textarea
                    placeholder="Description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className={styles.formRow}>
                  <select value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="TEAM">TEAM</option>
                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                  </select>
                </div>
                <div className={styles.formRow}>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={creating}>
                  {creating ? 'creating...' : 'create event →'}
                </button>
              </form>
            </div>
          )}

          {loading ? (
            <SkeletonList items={6} />
          ) : events.length === 0 ? (
            <div className={styles.empty}>No events yet. Create the first competition.</div>
          ) : (
            <div className={styles.teamsGrid}>
              {events.map((event, idx) => {
                const radiusClass =
                  idx % 4 === 0
                    ? styles.cardA
                    : idx % 4 === 1
                    ? styles.cardB
                    : idx % 4 === 2
                    ? styles.cardC
                    : styles.cardD;

                return (
                  <article key={event.id} className={`${styles.teamCard} ${radiusClass}`}>
                    <div className={styles.teamHeader}>
                      <h3>
                        <Link href={`/events/${event.id}`}>{event.name}</Link>
                      </h3>
                      <span className={`${styles.statusBadge} ${styles[`status_${event.status.toLowerCase()}`]}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className={styles.teamMeta}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>mode</span>
                        <span className={styles.metaValue}>{event.mode}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>creator</span>
                        <span className={styles.metaValue}>{event.creator}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>participants</span>
                        <span className={styles.metaValue}>{event.isParticipant ? 'joined' : 'open'}</span>
                      </div>
                    </div>
                    <div className={styles.teamActions}>
                      <Link href={`/events/${event.id}`} className={styles.viewBtn}>
                        view event →
                      </Link>
                      {!event.isParticipant && (
                        <button
                          className={styles.joinBtn}
                          onClick={() => handleJoin(event.id)}
                        >
                          join
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onChange={(newPage) => setCurrentPage(newPage)}
            />
          )}
        </div>
      </Layout>
    </>
  );
}
