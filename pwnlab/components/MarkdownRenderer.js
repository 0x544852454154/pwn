import React, { useMemo } from 'react';

export function MarkdownRenderer({ content }) {
  const rendered = useMemo(() => {
    if (!content) return '';
    const html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^#{1,6}\s+(.*$)/gim, (_, title) => `<h${title.length > 20 ? 6 : title.length > 10 ? 5 : title.length > 5 ? 4 : 3}>${title.trim()}</h${title.length > 20 ? 6 : title.length > 10 ? 5 : title.length > 5 ? 4 : 3}>`)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`{1,3}([^`]+)`{1,3}/g, '<code>$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/^[\-\*]\s+(.+)$/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>')
      .replace(/^(?!<[hluo])(.*$)/gim, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(\s*<(?:h|ul|pre))/g, '$1')
      .replace(/(<\/(?:h|ul|pre)>\s*)<\/p>/g, '$1');
    return html;
  }, [content]);

  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
