import React from 'react';
import styles from './Markdown.module.css';

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function parseInline(text) {
  let html = escapeHtml(text);

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return html;
}

function parseMarkdown(raw) {
  if (!raw) return '';

  const lines = raw.split('\n');
  const html = [];
  let inList = false;
  let listType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inList) html.push('<div class="code-block"><pre><code>');
      else html.push('<pre><code>');
      inList = !inList;
      continue;
    }

    if (inList) {
      html.push(escapeHtml(line) + '\n');
      continue;
    }

    if (line.startsWith('# ')) {
      html.push(`<h1>${parseInline(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      html.push(`<h2>${parseInline(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      html.push(`<h3>${parseInline(line.slice(4))}</h3>`);
    } else if (line.startsWith('- ')) {
      const content = parseInline(line.slice(2));
      html.push(`<li>${content}</li>`);
    } else if (line.startsWith('> ')) {
      html.push(`<blockquote>${parseInline(line.slice(2))}</blockquote>`);
    } else if (line.trim() === '') {
      if (listType === 'ul') {
        html.push('</ul>');
        listType = '';
      }
      html.push('<br/>');
    } else if (line.startsWith('---')) {
      html.push('<hr/>');
    } else {
      if (listType === 'ul') {
        html.push('</ul>');
        listType = '';
      }
      html.push(`<p>${parseInline(line)}</p>`);
    }
  }

  if (listType === 'ul') {
    html.push('</ul>');
  }

  return html.join('');
}

export default function Markdown({ content, className }) {
  const html = parseMarkdown(content);

  return (
    <div
      className={`${styles.markdown} ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
