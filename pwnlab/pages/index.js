import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <>
      <Head>
        <title>pwnlab · about</title>
        <meta
          name="description"
          content="pwnlab is a community-driven environment for learning ethical hacking, penetration testing, and cybersecurity through practical challenges and controlled experimentation."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <section className={styles.hero}>
          <div className={styles.kicker}>security education / community</div>
          <h1>
            learn.
            <br />
            break.
            <br />
            build.
          </h1>
          <p>
            <strong>pwnlab</strong> is a community-driven environment for learning
            ethical hacking, penetration testing, and cybersecurity through
            practical challenges and controlled experimentation.
          </p>

          <div className={styles.actions}>
            <Link href="/login" className={styles.btnPrimary}>
              enter platform ↗
            </Link>
            <Link href="/challenges" className={styles.btnSecondary}>
              view challenges
            </Link>
          </div>
        </section>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sideLabel}>contents</div>
            <ul className={styles.sideList}>
              <li>what is pwnlab</li>
              <li>our mission</li>
              <li>what we offer</li>
              <li>who is this for</li>
              <li>core principles</li>
              <li>development</li>
            </ul>
          </aside>

          <main className={styles.main}>
            <section className={styles.section}>
              <div className={styles.label} data-index="01">
                what is pwnlab
              </div>
              <p>
                pwnlab is a space where beginners and experienced practitioners
                can learn, share, and practice offensive and defensive security
                techniques in a legal and responsible environment.
              </p>
            </section>

            <section className={styles.section}>
              <div className={styles.label} data-index="02">
                our mission
              </div>
              <p>
                We believe cybersecurity knowledge should be accessible.
                pwnlab focuses on hands-on learning through curated labs,
                challenges, and realistic scenarios designed to turn theory
                into practical skill.
              </p>
            </section>

            <section className={styles.section}>
              <div className={styles.label} data-index="03">
                what we offer
              </div>
              <div className={styles.offerGrid}>
                <article className={styles.offer}>
                  <span className={styles.offerNum}>01</span>
                  <h3>CTF challenges</h3>
                  <p>Problems ranging from fundamentals to advanced concepts.</p>
                </article>
                <article className={styles.offer}>
                  <span className={styles.offerNum}>02</span>
                  <h3>Practical labs</h3>
                  <p>Controlled environments for learning security techniques.</p>
                </article>
                <article className={styles.offer}>
                  <span className={styles.offerNum}>03</span>
                  <h3>Knowledge sharing</h3>
                  <p>Walkthroughs, workshops, discussion, and community learning.</p>
                </article>
                <article className={styles.offer}>
                  <span className={styles.offerNum}>04</span>
                  <h3>Skill development</h3>
                  <p>A structured path from curiosity to practical capability.</p>
                </article>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.label} data-index="04">
                who is this for
              </div>
              <p>
                Anyone interested in cybersecurity. Whether you&apos;re learning
                the fundamentals, preparing for certifications, studying security,
                or sharpening existing skills, pwnlab is built around curiosity,
                experimentation, and continuous improvement.
              </p>
            </section>

            <section className={styles.section}>
              <div className={styles.label} data-index="05">
                core principles
              </div>
              <div className={styles.principles}>
                <div className={styles.principle}>
                  <strong>legal</strong>
                  <span>All activities stay within authorized and legal boundaries.</span>
                </div>
                <div className={styles.principle}>
                  <strong>ethical</strong>
                  <span>Responsible testing, disclosure, and defensive thinking come first.</span>
                </div>
                <div className={styles.principle}>
                  <strong>educational</strong>
                  <span>Every challenge should teach a useful concept or technique.</span>
                </div>
                <div className={styles.principle}>
                  <strong>collaborative</strong>
                  <span>Knowledge becomes stronger when people learn and build together.</span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.label} data-index="06">
                currently in development
              </div>
              <p>
                pwnlab is actively being built. New labs, challenges, and
                platform features are being added over time. Feedback and
                contributions will help shape what comes next.
              </p>
            </section>
          </main>
        </div>
      </Layout>
    </>
  );
}
