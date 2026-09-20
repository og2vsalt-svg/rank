import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';

const KEY = 'rank_md_desk_v1';

function renderLite(src: string) {
  const escaped = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\- (.*)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');
}

export default function MarkdownPage() {
  const [src, setSrc] = useState('# notes\n\nwrite something quiet.');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setSrc(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, src);
    } catch {}
  }, [src]);

  const html = useMemo(() => renderLite(src), [src]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 px-5 max-w-6xl mx-auto">
        <p className="text-[#0a84ff] text-sm mb-2">markdown desk</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">write. preview. keep it local.</h1>
        <p className="text-neutral-400 text-sm mb-6">not the vault. just a split view that remembers this browser.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <textarea
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            className="min-h-[420px] rounded-3xl bg-white/5 border border-white/10 px-4 py-4 text-sm outline-none font-mono"
          />
          <div
            className="min-h-[420px] rounded-3xl glass p-6 text-sm leading-relaxed prose-invert"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
    </div>
  );
}
