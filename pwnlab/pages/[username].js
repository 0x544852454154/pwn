import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Layout from '../../components/Layout';
import styles from '../../styles/Profile.module.css';
import { supabaseAdmin } from '../../lib/db';
import https from 'https';

function fetchJSON(url, headers = {}, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers, timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data: JSON.parse(data) });
        } catch {
          resolve({ ok: false, data: null });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, data: null });
    });

    req.on('error', () => {
      resolve({ ok: false, data: null });
    });
  });
}

function parseProfileMeta(rawBio) {
  if (!rawBio) return { bio: '', banner_url: null, friends: [] };
  try {
    const parsed = JSON.parse(rawBio);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        bio: typeof parsed.bio === 'string' ? parsed.bio : '',
        banner_url: typeof parsed.banner_url === 'string' ? parsed.banner_url : null,
        friends: Array.isArray(parsed.friends) ? parsed.friends : []
      };
    }
  } catch {}
  return { bio: rawBio, banner_url: null, friends: [] };
}

export async function getServerSideProps(context) {
  const { username } = context.params;
  const targetUsername = (username || '').trim().toLowerCase();

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, username, created_at')
      .eq('username', targetUsername)
      .single();

    if (!user) {
      return { notFound: true };
    }

    const [profileRes, discordRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('bio, rank_title').eq('user_id', user.id).single(),
      supabaseAdmin.from('discord_accounts').select('discord_id, username').eq('user_id', user.id).single()
    ]);

    const meta = parseProfileMeta(profileRes.data?.bio);
    const discordAccount = discordRes.data;

    let discordAvatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
    let discordStatus = 'offline';

    if (discordAccount?.discord_id) {
      const lanyardRes = await fetchJSON(`https://api.lanyard.rest/v1/users/${discordAccount.discord_id}`);
      if (lanyardRes.ok && lanyardRes.data?.success && lanyardRes.data?.data) {
        const d = lanyardRes.data.data;
        const u = d.discord_user || {};
        discordStatus = d.discord_status || 'offline';
        if (u.avatar) {
          const ext = u.avatar.startsWith('a_') ? 'gif' : 'png';
          discordAvatarUrl = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${ext}?size=256`;
        }
      }
    }

    return {
      props: {
        profile: {
          id: user.id,
          username: user.username,
          memberSince: user.created_at,
          bio: meta.bio,
          banner_url: meta.banner_url,
          discord: {
            discord_id: discordAccount?.discord_id || null,
            username: discordAccount?.username || null,
            avatarUrl: discordAvatarUrl,
            status: discordStatus
          }
        }
      }
    };
  } catch (error) {
    console.error('getServerSideProps error:', error);
    return { notFound: true };
  }
}

export default function PublicProfilePage({ profile }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch {
        // not logged in
      } finally {
        setLoadingAuth(false);
      }
    }
    checkAuth();
  }, []);

  const discord = profile.discord;
  const statusClass = discord?.status ? styles[`status_${discord.status}`] : styles.status_offline;
  const activeBannerUrl = profile.banner_url || null;
  const isOwnProfile = currentUser?.username?.toLowerCase() === profile.username.toLowerCase();

  return (
    <>
      <Head>
        <title>{profile.username} · pwnlab operator</title>
        <meta name="description" content={`pwnlab operator ${profile.username}`} />

        {/* Open Graph - Only PFP for clean embed */}
        <meta property="og:title" content={`${profile.username}`} />
        <meta property="og:description" content={profile.bio || 'pwnlab operator'} />
        <meta property="og:image" content={discord?.avatarUrl} />
        <meta property="og:image:width" content="256" />
        <meta property="og:image:height" content="256" />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://pwnlab.lol/${profile.username}`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content={discord?.avatarUrl} />
        <meta name="theme-color" content="#f23f43" />
      </Head>

      <Layout requireAuth={false}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.bannerWrapper}>
              <div className={styles.bannerPattern} />
              <div className={styles.bannerGlow} />

              {activeBannerUrl ? (
                <Image
                  src={activeBannerUrl}
                  alt="Custom Profile Banner"
                  fill
                  unoptimized
                  className={styles.bannerImg}
                />
              ) : null}
            </div>

            <div className={styles.profileContent}>
              <div className={styles.avatarContainer}>
                {discord?.avatarUrl ? (
                  <Image
                    src={discord.avatarUrl}
                    alt={profile.username}
                    width={120}
                    height={120}
                    unoptimized
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {profile.username.substring(0, 1).toUpperCase()}
                  </div>
                )}
                {discord && (
                  <span
                    className={`${styles.statusIndicator} ${statusClass}`}
                    title={`Discord Status: ${discord.status}`}
                  />
                )}
              </div>

              <div className={styles.namesRow}>
                <h1 className={styles.username}>{profile.username}</h1>
                {discord?.username && (
                  <span className={styles.discordTag}>@{discord.username}</span>
                )}
              </div>

              <div className={styles.bioContainer}>
                <div className={styles.bioHeader}>
                  <span className={styles.bioLabel}>biography</span>
                </div>
                <p className={styles.bioText}>
                  {profile.bio || 'No operator briefing recorded.'}
                </p>
              </div>
            </div>
          </div>

          {currentUser && !isOwnProfile && <PrivateProfileSection profile={profile} currentUser={currentUser} />}
          {currentUser && isOwnProfile && (
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>this is your profile</span>
                <span className={styles.statValue}>
                  <a href="/profile" style={{ color: '#f23f43', textDecoration: 'underline' }}>view full dossier →</a>
                </span>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

function PrivateProfileSection({ profile, currentUser }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/users/profile?username=${encodeURIComponent(profile.username)}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.profile);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [profile.username]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <span>loading operator intelligence...</span>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <>
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>challenges solved</span>
          <span className={styles.statValue}>{stats.challengesCompleted}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>ctf points</span>
          <span className={styles.statValue}>{stats.totalPoints}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>success rate</span>
          <span className={styles.statValue}>{stats.successRate}%</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>global rank</span>
          <span className={styles.statValue}>#{stats.rank}</span>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <section className={styles.section}>
          <h2>specialties</h2>
          {stats.specialties && stats.specialties.length > 0 ? (
            <div className={styles.tagList}>
              {stats.specialties.map((specialty) => (
                <span key={specialty} className={styles.tag}>
                  {specialty}
                </span>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No specialties recorded yet.</p>
          )}
        </section>

        <section className={styles.section}>
          <h2>alliance / team</h2>
          {stats.team ? (
            <a href={`/team/${stats.team.id}`} className={styles.teamLink}>
              {stats.team.name} →
            </a>
          ) : (
            <p className={styles.empty}>Not currently affiliated with a team.</p>
          )}
        </section>

        <section className={styles.section}>
          <h2>operator registration</h2>
          <p className={styles.memberSince}>
            {new Date(stats.memberSince).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </section>
      </div>
    </>
  );
}
