import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import styles from '../styles/Profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const { user: usernameQuery } = router.query;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tabs: 'overview' | 'friends'
  const [activeTab, setActiveTab] = useState('overview');
  const [friendsList, setFriendsList] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Rival comparison state
  const [rivalUser, setRivalUser] = useState(null);

  // Bio editing state
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // Banner editing state
  const [editingBanner, setEditingBanner] = useState(false);
  const [bannerInput, setBannerInput] = useState('');
  const [savingBanner, setSavingBanner] = useState(false);

  // Stalk / Friend state
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const url = usernameQuery
        ? `/api/users/profile?username=${encodeURIComponent(usernameQuery)}`
        : '/api/users/profile';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Profile not found');
      const data = await response.json();
      setProfile(data.profile);
      setBioInput(data.profile.bio || '');
      setBannerInput(data.profile.banner_url || '');
      setError('');
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [usernameQuery]);

  const fetchFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const response = await fetch('/api/users/friends');
      if (response.ok) {
        const data = await response.json();
        setFriendsList(data.friends || []);
      }
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends();
    }
  }, [activeTab, fetchFriends]);

  // Live refresh for Discord presence every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProfile();
      if (activeTab === 'friends') {
        fetchFriends();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchProfile, fetchFriends, activeTab]);

  async function handleSaveBio(e) {
    e.preventDefault();
    setSavingBio(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bioInput }),
      });
      if (response.ok) {
        setProfile((prev) => ({ ...prev, bio: bioInput }));
        setEditingBio(false);
      }
    } catch (err) {
      console.error('Failed to update bio:', err);
    } finally {
      setSavingBio(false);
    }
  }

  async function handleSaveBanner(e) {
    if (e && e.preventDefault) e.preventDefault();
    setSavingBanner(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_url: bannerInput.trim() }),
      });
      if (response.ok) {
        const data = await response.json();
        setProfile((prev) => ({ ...prev, banner_url: data.banner_url }));
        setEditingBanner(false);
      }
    } catch (err) {
      console.error('Failed to update banner:', err);
    } finally {
      setSavingBanner(false);
    }
  }

  async function handleResetBanner() {
    setSavingBanner(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_url: '' }),
      });
      if (response.ok) {
        setProfile((prev) => ({ ...prev, banner_url: null }));
        setBannerInput('');
        setEditingBanner(false);
      }
    } catch (err) {
      console.error('Failed to reset banner:', err);
    } finally {
      setSavingBanner(false);
    }
  }

  async function handleToggleFriend(targetUsername, isCurrentlyFriend) {
    setFriendActionLoading(true);
    try {
      const response = await fetch('/api/users/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUsername: targetUsername || profile?.username,
          action: isCurrentlyFriend ? 'remove' : 'add',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (profile && profile.username.toLowerCase() === (targetUsername || '').toLowerCase()) {
          setProfile((prev) => ({ ...prev, isFriend: data.isFriend }));
        }
        fetchFriends();
      }
    } catch (err) {
      console.error('Failed to toggle friend:', err);
    } finally {
      setFriendActionLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.loading}>loading operator dossier...</div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout requireAuth={true}>
        <div className={styles.error}>
          [ERROR]
          <br />
          {error || 'Profile not found'}
        </div>
      </Layout>
    );
  }

  const discord = profile.discord;
  const statusClass = discord?.status ? styles[`status_${discord.status}`] : styles.status_offline;
  const activeBannerUrl = profile.banner_url || discord?.bannerUrl || null;

  return (
    <>
      <Head>
        <title>{profile.username} · pwnlab dossier</title>
      </Head>

      <Layout requireAuth={true}>
        <div className={styles.container}>
          {/* ================= 1. HERO / BANNER WITH CENTERED PFP & BIO ================= */}
          <div className={styles.heroCard}>
            {/* Custom Banner Background */}
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

              {/* Edit Banner Button */}
              {profile.isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setEditingBanner((prev) => !prev)}
                  className={styles.editBannerBtn}
                  title="Change banner image URL"
                >
                  {editingBanner ? 'close banner editor ✕' : 'custom banner ✎'}
                </button>
              )}
            </div>

            {/* Banner URL Modal / Inline Form */}
            {editingBanner && (
              <div className={styles.bannerEditOverlay}>
                <form onSubmit={handleSaveBanner} className={styles.bannerEditForm}>
                  <label htmlFor="banner-url-input" className={styles.bannerEditLabel}>
                    CUSTOM BANNER IMAGE URL (HTTPS)
                  </label>
                  <div className={styles.bannerInputRow}>
                    <input
                      id="banner-url-input"
                      type="url"
                      value={bannerInput}
                      onChange={(e) => setBannerInput(e.target.value)}
                      placeholder="https://example.com/your-cyber-banner.jpg"
                      className={styles.bannerInput}
                      autoFocus
                    />
                    <button type="submit" disabled={savingBanner} className={styles.saveBannerBtn}>
                      {savingBanner ? 'saving...' : 'apply banner'}
                    </button>
                    {profile.banner_url && (
                      <button
                        type="button"
                        disabled={savingBanner}
                        onClick={handleResetBanner}
                        className={styles.removeBannerBtn}
                      >
                        remove banner
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setBannerInput(profile.banner_url || '');
                        setEditingBanner(false);
                      }}
                      className={styles.cancelBannerBtn}
                    >
                      cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Centered Profile Picture, Identity & Bio */}
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

              {/* Names & Badges */}
              <div className={styles.namesRow}>
                <h1 className={styles.username}>{profile.username}</h1>
                {discord?.clan && <span className={styles.clanBadge}>[{discord.clan}]</span>}
                {discord?.username && (
                  <span className={styles.discordTag}>@{discord.username}</span>
                )}
                {!profile.isOwnProfile && (
                  <button
                    type="button"
                    disabled={friendActionLoading}
                    onClick={() => handleToggleFriend(profile.username, profile.isFriend)}
                    className={
                      profile.isFriend ? styles.profileFriendBtnActive : styles.profileFriendBtn
                    }
                  >
                    {friendActionLoading ? '...' : profile.isFriend ? '★ friended' : '+ add friend'}
                  </button>
                )}
              </div>

              {/* Custom Status */}
              {discord?.custom_status && (
                <div className={styles.customStatus}>
                  {discord.custom_status_emoji && <span>{discord.custom_status_emoji}</span>}
                  <span>{discord.custom_status}</span>
                </div>
              )}

              {/* Live Spotify or Activity Pill */}
              {discord?.spotify ? (
                <div className={styles.activityPill}>
                  <span className={styles.activityIcon}>🎵</span>
                  <div className={styles.activityText}>
                    <span className={styles.activityTitle}>{discord.spotify.song}</span>
                    <span className={styles.activitySub}>by {discord.spotify.artist}</span>
                  </div>
                </div>
              ) : discord?.activities?.length > 0 ? (
                <div className={styles.activityPill}>
                  <span className={styles.activityIcon}>🎮</span>
                  <div className={styles.activityText}>
                    <span className={styles.activityTitle}>{discord.activities[0].name}</span>
                    {discord.activities[0].details && (
                      <span className={styles.activitySub}>{discord.activities[0].details}</span>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Bio Below PFP */}
              <div className={styles.bioContainer}>
                <div className={styles.bioHeader}>
                  <span className={styles.bioLabel}>biography</span>
                  {profile.isOwnProfile && !editingBio && (
                    <button
                      type="button"
                      onClick={() => setEditingBio(true)}
                      className={styles.editBioBtn}
                    >
                      edit bio ✎
                    </button>
                  )}
                </div>

                {editingBio ? (
                  <form onSubmit={handleSaveBio} className={styles.bioEditForm}>
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      maxLength={500}
                      placeholder="Write your custom operator bio..."
                      className={styles.bioTextarea}
                      autoFocus
                    />
                    <div className={styles.bioActions}>
                      <button type="submit" disabled={savingBio} className={styles.saveBioBtn}>
                        {savingBio ? 'saving...' : 'save bio'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBioInput(profile.bio || '');
                          setEditingBio(false);
                        }}
                        className={styles.cancelBioBtn}
                      >
                        cancel
                      </button>
                    </div>
                  </form>
                ) : profile.bio ? (
                  <p className={styles.bioText}>{profile.bio}</p>
                ) : (
                  <p className={styles.bioTextEmpty}>
                    {profile.isOwnProfile
                      ? 'No bio set. Click "edit bio" to add your briefing.'
                      : 'No biography recorded.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ================= TABS: OVERVIEW & FRIENDS HUB ================= */}
          <div className={styles.profileTabs}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`${styles.profileTab} ${activeTab === 'overview' ? styles.profileTabActive : ''}`}
            >
              dossier overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`${styles.profileTab} ${activeTab === 'friends' ? styles.profileTabActive : ''}`}
            >
              operator network / friends ({profile.friendsCount || 0})
            </button>
          </div>

          {activeTab === 'overview' ? (
            <>
              {/* ================= 2. STATS BELOW BANNER ================= */}
              <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>challenges solved</span>
                  <span className={styles.statValue}>{profile.challengesCompleted}</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>ctf points</span>
                  <span className={styles.statValue}>{profile.totalPoints}</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>success rate</span>
                  <span className={styles.statValue}>{profile.successRate}%</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>global rank</span>
                  <span className={styles.statValue}>#{profile.rank}</span>
                </div>
              </div>

              {/* ================= 3. DETAILS GRID ================= */}
              <div className={styles.detailsGrid}>
                <section className={styles.section}>
                  <h2>specialties</h2>
                  {profile.specialties && profile.specialties.length > 0 ? (
                    <div className={styles.tagList}>
                      {profile.specialties.map((specialty) => (
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
                  {profile.team ? (
                    <Link href={`/team/${profile.team.id}`} className={styles.teamLink}>
                      {profile.team.name} →
                    </Link>
                  ) : (
                    <p className={styles.empty}>Not currently affiliated with a team.</p>
                  )}
                </section>

                <section className={styles.section}>
                  <h2>operator registration</h2>
                  <p className={styles.memberSince}>
                    {new Date(profile.memberSince).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </section>
              </div>
            </>
          ) : (
            /* ================= FRIENDS & STALKING HUB ================= */
            <div>
              {friendsLoading ? (
                <div className={styles.loading}>loading operator network...</div>
              ) : friendsList.length === 0 ? (
                <div className={styles.empty}>
                  No operators added to your network yet. Stalk and add friends from the{' '}
                  <Link href="/leaderboard" style={{ color: '#fff', textDecoration: 'underline', marginLeft: 4 }}>
                    leaderboard
                  </Link>
                  .
                </div>
              ) : (
                <div className={styles.friendsGrid}>
                  {friendsList.map((friend) => {
                    const fDiscord = friend.discord;
                    const fStatusClass = fDiscord?.status ? styles[`status_${fDiscord.status}`] : styles.status_offline;

                    return (
                      <div key={friend.id} className={styles.friendCard}>
                        <div className={styles.friendCardHeader}>
                          <div className={styles.friendInfo}>
                            <div className={styles.friendAvatarWrapper}>
                              {fDiscord?.avatarUrl ? (
                                <Image
                                  src={fDiscord.avatarUrl}
                                  alt={friend.username}
                                  width={48}
                                  height={48}
                                  unoptimized
                                  className={styles.friendAvatar}
                                />
                              ) : (
                                <div className={styles.friendAvatarPlaceholder}>
                                  {friend.username.substring(0, 1).toUpperCase()}
                                </div>
                              )}
                              <span
                                className={`${styles.friendStatusDot} ${fStatusClass}`}
                                title={`Discord Status: ${fDiscord?.status || 'offline'}`}
                              />
                            </div>

                            <div className={styles.friendNames}>
                              <Link
                                href={`/user/${encodeURIComponent(friend.username)}`}
                                className={styles.friendUsername}
                              >
                                {friend.username}
                              </Link>
                              {fDiscord?.username && (
                                <span className={styles.friendDiscord}>@{fDiscord.username}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Live Activity if any */}
                        {fDiscord?.spotify ? (
                          <div className={styles.activityPill} style={{ margin: 0 }}>
                            <span className={styles.activityIcon}>🎵</span>
                            <div className={styles.activityText}>
                              <span className={styles.activityTitle}>{fDiscord.spotify.song}</span>
                              <span className={styles.activitySub}>by {fDiscord.spotify.artist}</span>
                            </div>
                          </div>
                        ) : fDiscord?.activities?.length > 0 ? (
                          <div className={styles.activityPill} style={{ margin: 0 }}>
                            <span className={styles.activityIcon}>🎮</span>
                            <div className={styles.activityText}>
                              <span className={styles.activityTitle}>{fDiscord.activities[0].name}</span>
                              {fDiscord.activities[0].details && (
                                <span className={styles.activitySub}>{fDiscord.activities[0].details}</span>
                              )}
                            </div>
                          </div>
                        ) : null}

                        {/* Friend Mini Stats */}
                        <div className={styles.friendStatsMini}>
                          <div className={styles.friendStatItem}>
                            <span className={styles.friendStatLabel}>Points</span>
                            <span className={styles.friendStatVal}>{friend.totalPoints} pts</span>
                          </div>
                          <div className={styles.friendStatItem}>
                            <span className={styles.friendStatLabel}>Solves</span>
                            <span className={styles.friendStatVal}>{friend.challengesCompleted}</span>
                          </div>
                          <div className={styles.friendStatItem}>
                            <span className={styles.friendStatLabel}>Accuracy</span>
                            <span className={styles.friendStatVal}>{friend.successRate}%</span>
                          </div>
                        </div>

                        {/* Friend Actions */}
                        <div className={styles.friendActions}>
                          <button
                            type="button"
                            onClick={() => setRivalUser(friend)}
                            className={styles.compareBtn}
                          >
                            rival compare ⚔️
                          </button>
                          <Link
                            href={`/user/${encodeURIComponent(friend.username)}`}
                            className={styles.stalkBtn}
                          >
                            stalk ↗
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleFriend(friend.username, true)}
                            className={styles.unfriendBtn}
                            title="Unfollow operator"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= HEAD-TO-HEAD RIVAL COMPARISON MODAL ================= */}
          {rivalUser && (
            <div className={styles.rivalModalOverlay} onClick={() => setRivalUser(null)}>
              <div className={styles.rivalModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.rivalModalHeader}>
                  <div className={styles.rivalModalTitle}>⚔️ Head-to-Head Comparison</div>
                  <button
                    type="button"
                    onClick={() => setRivalUser(null)}
                    className={styles.closeModalBtn}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.rivalVersusRow}>
                  <div className={styles.rivalOperator}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#569cd6' }}>{profile.username} (You)</h3>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{profile.totalPoints} pts</span>
                  </div>

                  <div className={styles.rivalVsBadge}>VS</div>

                  <div className={styles.rivalOperator}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f23f43' }}>{rivalUser.username}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{rivalUser.totalPoints} pts</span>
                  </div>
                </div>

                <div className={styles.rivalStatsList}>
                  {/* Points Bar */}
                  <div className={styles.rivalStatRow}>
                    <div className={styles.rivalStatHeader}>
                      <span>{profile.totalPoints} pts</span>
                      <span>CTF Points</span>
                      <span>{rivalUser.totalPoints} pts</span>
                    </div>
                    <div className={styles.rivalBar}>
                      <div
                        className={styles.rivalBarLeft}
                        style={{
                          width: `${
                            (profile.totalPoints /
                              Math.max(1, profile.totalPoints + rivalUser.totalPoints)) *
                            100
                          }%`,
                        }}
                      />
                      <div
                        className={styles.rivalBarRight}
                        style={{
                          width: `${
                            (rivalUser.totalPoints /
                              Math.max(1, profile.totalPoints + rivalUser.totalPoints)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Solves Bar */}
                  <div className={styles.rivalStatRow}>
                    <div className={styles.rivalStatHeader}>
                      <span>{profile.challengesCompleted} solves</span>
                      <span>Challenges Solved</span>
                      <span>{rivalUser.challengesCompleted} solves</span>
                    </div>
                    <div className={styles.rivalBar}>
                      <div
                        className={styles.rivalBarLeft}
                        style={{
                          width: `${
                            (profile.challengesCompleted /
                              Math.max(1, profile.challengesCompleted + rivalUser.challengesCompleted)) *
                            100
                          }%`,
                        }}
                      />
                      <div
                        className={styles.rivalBarRight}
                        style={{
                          width: `${
                            (rivalUser.challengesCompleted /
                              Math.max(1, profile.challengesCompleted + rivalUser.challengesCompleted)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className={styles.rivalStatRow}>
                    <div className={styles.rivalStatHeader}>
                      <span>{profile.successRate}%</span>
                      <span>Accuracy Rate</span>
                      <span>{rivalUser.successRate}%</span>
                    </div>
                    <div className={styles.rivalBar}>
                      <div
                        className={styles.rivalBarLeft}
                        style={{
                          width: `${
                            (profile.successRate /
                              Math.max(1, profile.successRate + rivalUser.successRate)) *
                            100
                          }%`,
                        }}
                      />
                      <div
                        className={styles.rivalBarRight}
                        style={{
                          width: `${
                            (rivalUser.successRate /
                              Math.max(1, profile.successRate + rivalUser.successRate)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
