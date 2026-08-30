import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { SkeletonList } from '../components/Skeleton';
import styles from '../styles/Teams.module.css';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [myTeamId, setMyTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const response = await fetch(`/api/teams?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setTeams(data.teams);
      setMyTeamId(data.myTeamId);
      setError('');
    } catch (err) {
      setError('Failed to load teams');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || 'Failed to create team');
        setCreating(false);
        return;
      }

      setTeamName('');
      setShowCreateForm(false);
      fetchTeams();
    } catch (err) {
      setCreateError('An error occurred');
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinTeam(teamId) {
    try {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to join team');
        return;
      }

      fetchTeams();
    } catch (err) {
      setError('Failed to join team');
      console.error(err);
    }
  }

  return (
    <>
      <Head>
        <title>pwnlab · teams</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <div className={styles.kicker}>groups / alliances</div>
              <h1>teams</h1>
            </div>
            {!myTeamId && (
              <button
                className={styles.createBtn}
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? 'cancel' : '+ create team'}
              </button>
            )}
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
              placeholder="Search teams..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className={styles.searchInput}
            />
          </div>

          {showCreateForm && (
            <div className={styles.createForm}>
              <h3>form new team</h3>

              {createError && (
                <div className={styles.formError}>{createError}</div>
              )}

              <form onSubmit={handleCreateTeam}>
                <div className={styles.formRow}>
                  <input
                    type="text"
                    placeholder="Team name (3-100 characters)..."
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    disabled={creating}
                    minLength={3}
                    maxLength={100}
                    required
                  />
                  <button type="submit" disabled={creating}>
                    {creating ? 'creating...' : 'create →'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <SkeletonList items={6} />
          ) : teams.length === 0 ? (
            <div className={styles.empty}>No teams yet. Form the first one.</div>
          ) : (
            <div className={styles.teamsGrid}>
              {teams.map((team, idx) => {
                const radiusClass =
                  idx % 4 === 0
                    ? styles.cardA
                    : idx % 4 === 1
                    ? styles.cardB
                    : idx % 4 === 2
                    ? styles.cardC
                    : styles.cardD;

                return (
                  <article key={team.id} className={`${styles.teamCard} ${radiusClass}`}>
                    <div className={styles.teamHeader}>
                      <h3>
                        <Link href={`/team/${team.id}`}>{team.name}</Link>
                      </h3>
                      {myTeamId === team.id && (
                        <span className={styles.yourTeamBadge}>your team</span>
                      )}
                    </div>

                    <div className={styles.teamMeta}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>founder</span>
                        <span className={styles.metaValue}>{team.owner_username}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>members</span>
                        <span className={styles.metaValue}>{team.member_count}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>score</span>
                        <span className={styles.metaValue}>{team.team_points} pts</span>
                      </div>
                    </div>

                    <div className={styles.teamActions}>
                      <Link href={`/team/${team.id}`} className={styles.viewBtn}>
                        view team →
                      </Link>
                      {!myTeamId && (
                        <button
                          className={styles.joinBtn}
                          onClick={() => handleJoinTeam(team.id)}
                        >
                          join team
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
