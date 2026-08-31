import '../styles/globals.css';
import { useEffect } from 'react';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    document.body.style.display = 'block';
  }, []);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.svg" sizes="any" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
