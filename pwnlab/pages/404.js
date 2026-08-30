import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/Error.module.css';

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>404 · not found · pwnlab</title>
      </Head>

      <Layout>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.kicker}>error 404 / routing fault</div>
            <h1 className={styles.code}>404</h1>
            <h2 className={styles.message}>target not found</h2>
            <p className={styles.description}>
              The requested endpoint or sector does not exist or has been relocated.
            </p>
            <Link href="/" className={styles.link}>
              return home →
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
}
