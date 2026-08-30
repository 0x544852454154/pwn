import React from 'react';
import styles from './Skeleton.module.css';

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.line} style={{ width: '60%', height: 16 }} />
      <div className={styles.line} style={{ width: '100%', height: 12 }} />
      <div className={styles.line} style={{ width: '85%', height: 12 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className={styles.table}>
      <div className={styles.tableHeader}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={styles.line} style={{ height: 14 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className={styles.tableRow}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div key={colIdx} className={styles.line} style={{ height: 12 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className={styles.stats}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.statBox}>
          <div className={styles.line} style={{ width: '50%', height: 12 }} />
          <div className={styles.line} style={{ width: '70%', height: 24 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 4 }) {
  return (
    <div className={styles.list}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className={styles.listItem}>
          <div className={styles.line} style={{ width: '40%', height: 14 }} />
          <div className={styles.line} style={{ width: '100%', height: 12 }} />
          <div className={styles.line} style={{ width: '70%', height: 12 }} />
        </div>
      ))}
    </div>
  );
}
