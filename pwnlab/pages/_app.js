import '../styles/globals.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    document.body.style.display = 'block';
  }, []);

  return <Component {...pageProps} />;
}
