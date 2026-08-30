import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import styles from '../../../styles/Teams.module.css';

export default function MachinesPage() {
  const router = useRouter();
  const { id } = router.query;
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [running, setRunning] = useState({});

  const fetchMachines = useCallback(async () => {
    try {
      const response = await fetch(`/api/challenges/${id}`);
      if (!response.ok) throw new Error('Failed to fetch challenge');
      const data = await response.json();
      const challenge = data.challenge;
      if (!challenge) throw new Error('Challenge not found');

      const machinesRes = await fetch(`/api/challenges/${id}/machines`);
      const machinesData = machinesRes.ok ? await machinesRes.json() : { machines: [] };

      setMachines(machinesData.machines || []);
      setError('');
    } catch (err) {
      setError('Failed to load machines');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchMachines();
  }, [id, fetchMachines]);

  async function startMachine(machineId) {
    setRunning(prev => ({ ...prev, [machineId]: true }));
    try {
      const response = await fetch(`/api/machines/${machineId}/start`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status: 'RUNNING', instance: data.instance } : m));
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(prev => ({ ...prev, [machineId]: false }));
    }
  }

  async function stopMachine(machineId) {
    setRunning(prev => ({ ...prev, [machineId]: true }));
    try {
      const response = await fetch(`/api/machines/${machineId}/stop`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status: 'STOPPED', instance: null } : m));
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(prev => ({ ...prev, [machineId]: false }));
    }
  }

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.loading}>loading machines...</div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>pwnlab · machines</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <div className={styles.kicker}>target infrastructure</div>
              <h1>machines</h1>
            </div>
            <Link href={`/challenge/${id}`} className={styles.backLink}>
              ← back to challenge
            </Link>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          {machines.length === 0 ? (
            <div className={styles.empty}>No machines associated with this challenge.</div>
          ) : (
            <div className={styles.teamsGrid}>
              {machines.map((machine, idx) => {
                const radiusClass =
                  idx % 4 === 0
                    ? styles.cardA
                    : idx % 4 === 1
                    ? styles.cardB
                    : idx % 4 === 2
                    ? styles.cardC
                    : styles.cardD;

                return (
                  <article key={machine.id} className={`${styles.teamCard} ${radiusClass}`}>
                    <div className={styles.teamHeader}>
                      <h3>{machine.name}</h3>
                      <span className={`${styles.statusBadge} ${machine.status === 'RUNNING' ? styles.status_active : styles.status_scheduled}`}>
                        {machine.status}
                      </span>
                    </div>
                    <div className={styles.teamMeta}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>target ip</span>
                        <span className={styles.metaValue}>{machine.target_ip || 'N/A'}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>ports</span>
                        <span className={styles.metaValue}>{machine.ports || 'N/A'}</span>
                      </div>
                    </div>
                    <div className={styles.teamActions}>
                      {machine.status === 'RUNNING' ? (
                        <button
                          className={styles.stopBtn}
                          onClick={() => stopMachine(machine.id)}
                          disabled={running[machine.id]}
                        >
                          {running[machine.id] ? 'stopping...' : 'stop machine'}
                        </button>
                      ) : (
                        <button
                          className={styles.joinBtn}
                          onClick={() => startMachine(machine.id)}
                          disabled={running[machine.id]}
                        >
                          {running[machine.id] ? 'starting...' : 'start machine'}
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
