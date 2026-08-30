import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
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

    const [profileRes, discordRes, completionsRes, submissionsRes, allCompletionsRes, teamMemberRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('bio, rank_title').eq('user_id', user.id).single(),
      supabaseAdmin.from('discord_accounts').select('discord_id, username').eq('user_id', user.id).single(),
      supabaseAdmin.from('challenge_completions').select('points_earned, challenge:challenges(category:challenge_categories(name))').eq('user_id', user.id),
      supabaseAdmin.from('challenge_submissions').select('is_correct').eq('user_id', user.id),
      supabaseAdmin.from('challenge_completions').select('user_id, points_earned'),
      supabaseAdmin.from('team_members').select('team:teams(id, name)').eq('user_id', user.id).maybeSingle()
    ]);

    const meta = parseProfileMeta(profileRes.data?.bio);
    const discordAccount = discordRes.data;

    // Fetch Discord Avatar from Lanyard or Discord API
    let discordAvatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
    let discordStatus = 'offline';
    let discordUser = null;

    if (discordAccount?.discord_id) {
      const lanyardRes = await fetchJSON(`https://api.lanyard.rest/v1/users/${discordAccount.discord_id}`);
      if (lanyardRes.ok && lanyardRes.data?.success && lanyardRes.data?.data) {
        const d = lanyardRes.data.data;
        discordUser = d.discord_user;
        discordStatus = d.discord_status || 'offline';
        if (discordUser?.avatar) {
          const ext = discordUser.avatar.startsWith('a_') ? 'gif' : 'png';
          discordAvatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${ext}?size=256`;
        }
      }
    }

    // Completions & points
    const completions = completionsRes.data || [];
    const challengesCompleted = completions.length;
    const totalPoints = completions.reduce((sum, c) => sum + (c.points_earned || 0), 0);

    const submissions = submissionsRes.data || [];
    const totalSubs = submissions.length;
    const correctSubs = submissions.filter(s => s.is_correct).length;
    const successRate = totalSubs > 0 ? Math.round((correctSubs / totalSubs) * 100) : 0;

    // Specialties
    const catCounts = {};
    for (const c of completions) {
      const catName = c.challenge?.category?.name;
      if (catName) catCounts[catName] = (catCounts[catName] || 0) + 1;
    }
    const specialties = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(entry => entry[0]);

    // Rank
    const userScores = {};
    for (const row of (allCompletionsRes.data || [])) {
      userScores[row.user_id] = (userScores[row.user_id] || 0) + (row.points_earned || 0);
    }
    let rank = 1;
    for (const [uid, score] of Object.entries(userScores)) {
      if (uid !== user.id && score > totalPoints) {
        rank++;
      }
    }

    return {
      props: {
        operator: {
          id: user.id,
          username: user.username,
          memberSince: user.created_at,
          bio: meta.bio,
          banner_url: meta.banner_url,
          challengesCompleted,
          totalPoints,
          successRate,
          rank,
          specialties,
          team: teamMemberRes.data?.team || null,
          discord: {
            discord_id: discordAccount?.discord_id || null,
            username: discordAccount?.username || null,
            avatarUrl: discordAvatarUrl,
            status: discordStatus,
            clan: discordUser?.primary_guild?.tag || null,
          }
        }
      }
    };
  } catch (error) {
    console.error('getServerSideProps error:', error);
    return { notFound: true };
  }
}

export default function PublicUserProfilePage({ operator }) {
  const [friendLoading, setFriendLoading] = useState(false);
  const [isFriend, setIsFriend] = useState(false);

  const discord = operator.discord;
  const statusClass = discord?.status ? styles[`status_${discord.status}`] : styles.status_offline;
  const activeBannerUrl = operator.banner_url || null;

  async function handleToggleFriend() {
    setFriendLoading(true);
    try {
      const res = await fetch('/api/users/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUsername: operator.username,
          action: isFriend ? 'remove' : 'add',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFriend(data.isFriend);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFriendLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{operator.username} · pwnlab operator dossier</title>
        <meta name="description" content={`pwnlab dossier for ${operator.username} | Rank #${operator.rank} | ${operator.totalPoints} CTF Points`} />
        
        {/* Open Graph Discord & Twitter Embed Metadata */}
        <meta property="og:title" content={`${operator.username} · pwnlab operator dossier`} />
        <meta property="og:description" content={`Operator Dossier | Rank #${operator.rank} | ${operator.challengesCompleted} Solves | ${operator.totalPoints} Points`} />
        <meta property="og:image" content={discord?.avatarUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://pwnlab.lol/user/${operator.username}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${operator.username} · pwnlab dossier`} />
        <meta name="twitter:description" content={`Rank #${operator.rank} | ${operator.totalPoints} CTF Points`} />
        <meta name="twitter:image" content={discord?.avatarUrl} />
        <meta name="theme-color" content="#f23f43" />
      </Head>

      <Layout requireAuth={false}>
        <div className={styles.container}>
          {/* ================= HERO / BANNER CARD ================= */}
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

            {/* Centered Profile Picture, Identity & Bio */}
            <div className={styles.profileContent}>
              <div className={styles.avatarContainer}>
                {discord?.avatarUrl ? (
                  <Image
                    src={discord.avatarUrl}
                    alt={operator.username}
                    width={120}
                    height={120}
                    unoptimized
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {operator.username.substring(0, 1).toUpperCase()}
                  </div>
                )}
                {discord && (
                  <span
                    className={`${styles.statusIndicator} ${statusClass}`}
                    title={`Discord Status: ${discord.status}`}
                  />
                )}
              </div>

              {/* Names & Badges */}
              <div className={styles.namesRow}>
                <h1 className={styles.username}>{operator.username}</h1>
                {discord?.clan && <span className={styles.clanBadge}>[{discord.clan}]</span>}
                {discord?.username && (
                  <span className={styles.discordTag}>@{discord.username}</span>
                )}
                <button
                  type="button"
                  disabled={friendLoading}
                  onClick={handleToggleFriend}
                  className={isFriend ? styles.profileFriendBtnActive : styles.profileFriendBtn}
                >
                  {friendLoading ? '...' : isFriend ? '★ friended' : '+ add friend'}
                </button>
              </div>

              {/* Bio Below PFP */}
              <div className={styles.bioContainer}>
                <div className={styles.bioHeader}>
                  <span className={styles.bioLabel}>biography</span>
                </div>
                <p className={styles.bioText}>
                  {operator.bio || 'No operator briefing recorded.'}
                </p>
              </div>
            </div>
          </div>

          {/* ================= 2. STATS BELOW BANNER ================= */}
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>challenges solved</span>
              <span className={styles.statValue}>{operator.challengesCompleted}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>ctf points</span>
              <span className={styles.statValue}>{operator.totalPoints}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>success rate</span>
              <span className={styles.statValue}>{operator.successRate}%</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>global rank</span>
              <span className={styles.statValue}>#{operator.rank}</span>
            </div>
          </div>

          {/* ================= 3. DETAILS GRID ================= */}
          <div className={styles.detailsGrid}>
            <section className={styles.section}>
              <h2>specialties</h2>
              {operator.specialties && operator.specialties.length > 0 ? (
                <div className={styles.tagList}>
                  {operator.specialties.map((specialty) => (
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
              {operator.team ? (
                <Link href={`/team/${operator.team.id}`} className={styles.teamLink}>
                  {operator.team.name} →
                </Link>
              ) : (
                <p className={styles.empty}>Not currently affiliated with a team.</p>
              )}
            </section>

            <section className={styles.section}>
              <h2>operator registration</h2>
              <p className={styles.memberSince}>
                {new Date(operator.memberSince).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
}
