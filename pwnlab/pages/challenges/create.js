import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from '../../styles/Challenges.module.css';

export default function CreateChallengePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'WEB',
    difficulty: 'EASY',
    points: 50,
    estimatedTime: 30,
    flag: '',
    visibility: 'PUBLIC'
  });
  const [objectives, setObjectives] = useState(['']);
  const [hints, setHints] = useState([{ text: '', penalty: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'INSANE'];

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addObjective() {
    setObjectives(prev => [...prev, '']);
  }

  function updateObjective(idx, value) {
    setObjectives(prev => prev.map((o, i) => i === idx ? value : o));
  }

  function removeObjective(idx) {
    setObjectives(prev => prev.filter((_, i) => i !== idx));
  }

  function addHint() {
    setHints(prev => [...prev, { text: '', penalty: 0 }]);
  }

  function updateHint(idx, field, value) {
    setHints(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  }

  function removeHint(idx) {
    setHints(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const body = {
        ...form,
        objectives: objectives.filter(o => o.trim()),
        hints: hints.filter(h => h.text.trim()).map(h => ({ text: h.text, penalty: h.penalty }))
      };

      const response = await fetch('/api/challenges/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create challenge');

      router.push('/challenges');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>pwnlab · create challenge</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.kicker}>challenge workshop / create</div>
            <h1>create challenge</h1>
          </div>

          {error && (
            <div className={styles.error}>
              [ERROR]
              <br />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.createForm}>
            <div className={styles.formGroup}>
              <label>name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                required
                maxLength={255}
              />
            </div>

            <div className={styles.formGroup}>
              <label>description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>category</label>
                <select value={form.category} onChange={(e) => updateForm('category', e.target.value)}>
                  <option value="LINUX">LINUX</option>
                  <option value="NETWORKING">NETWORKING</option>
                  <option value="WEB">WEB</option>
                  <option value="CRYPTOGRAPHY">CRYPTOGRAPHY</option>
                  <option value="FORENSICS">FORENSICS</option>
                  <option value="OSINT">OSINT</option>
                  <option value="REVERSE ENGINEERING">REVERSE ENGINEERING</option>
                  <option value="BINARY EXPLOITATION">BINARY EXPLOITATION</option>
                  <option value="PRIVILEGE ESCALATION">PRIVILEGE ESCALATION</option>
                  <option value="ACTIVE DIRECTORY">ACTIVE DIRECTORY</option>
                  <option value="API SECURITY">API SECURITY</option>
                  <option value="STEGANOGRAPHY">STEGANOGRAPHY</option>
                  <option value="MALWARE ANALYSIS">MALWARE ANALYSIS</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>difficulty</label>
                <select value={form.difficulty} onChange={(e) => updateForm('difficulty', e.target.value)}>
                  {DIFFICULTIES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>points</label>
                <input
                  type="number"
                  value={form.points}
                  onChange={(e) => updateForm('points', parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>

              <div className={styles.formGroup}>
                <label>estimated time (min)</label>
                <input
                  type="number"
                  value={form.estimatedTime}
                  onChange={(e) => updateForm('estimatedTime', parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>flag</label>
              <input
                type="text"
                value={form.flag}
                onChange={(e) => updateForm('flag', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>visibility</label>
              <select value={form.visibility} onChange={(e) => updateForm('visibility', e.target.value)}>
                <option value="PUBLIC">PUBLIC</option>
                <option value="PRIVATE">PRIVATE</option>
                <option value="TEAM ONLY">TEAM ONLY</option>
              </select>
            </div>

            <div className={styles.section}>
              <h3>objectives</h3>
              {objectives.map((obj, idx) => (
                <div key={idx} className={styles.objectiveRow}>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => updateObjective(idx, e.target.value)}
                    placeholder={`Objective ${idx + 1}`}
                  />
                  {objectives.length > 1 && (
                    <button type="button" onClick={() => removeObjective(idx)} className={styles.removeBtn}>
                      remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addObjective} className={styles.addBtn}>
                + add objective
              </button>
            </div>

            <div className={styles.section}>
              <h3>hints</h3>
              {hints.map((hint, idx) => (
                <div key={idx} className={styles.hintRow}>
                  <input
                    type="text"
                    value={hint.text}
                    onChange={(e) => updateHint(idx, 'text', e.target.value)}
                    placeholder="Hint text..."
                  />
                  <input
                    type="number"
                    value={hint.penalty}
                    onChange={(e) => updateHint(idx, 'penalty', parseInt(e.target.value) || 0)}
                    placeholder="penalty"
                    min={0}
                  />
                  {hints.length > 1 && (
                    <button type="button" onClick={() => removeHint(idx)} className={styles.removeBtn}>
                      remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addHint} className={styles.addBtn}>
                + add hint
              </button>
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'creating...' : 'create challenge →'}
            </button>
          </form>
        </div>
      </Layout>
    </>
  );
}
