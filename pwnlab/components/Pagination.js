import React from 'react';
import styles from './Pagination.module.css';

function generatePages(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  const pageNumbers = generatePages(page, pages);

  return (
    <div className={styles.pagination}>
      <button
        className={styles.navBtn}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ← prev
      </button>

      <div className={styles.pageNumbers}>
        {pageNumbers.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={p}
              className={`${styles.pageBtn} ${p === page ? styles.active : ''}`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        className={styles.navBtn}
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
      >
        next →
      </button>
    </div>
  );
}
