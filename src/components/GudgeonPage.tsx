import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function linesOf(text: string) {
  return text.replace(/\r\n/g, '\n').split('\n');
}

export default function GudgeonPage() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [error, setError] = useState('');

  const diff = useMemo(() => {
    const a = linesOf(left);
    const b = linesOf(right);
    const n = Math.max(a.length, b.length);
    const rows: { kind: 'same' | 'left' | 'right'; text: string }[] = [];
    for (let i = 0; i < n; i++) {
      if (a[i] === b[i]) rows.push({ kind: 'same', text: a[i] ?? '' });
      else {
        if (a[i] !== undefined) rows.push({ kind: 'left', text: a[i] });
        if (b[i] !== undefined) rows.push({ kind: 'right', text: b[i] });
      }
    }
    return rows.slice(0, 400);
  }, [left, right]);

  const publish = async () => {
    setBusy(true);
    setError('');
    const body = diff.map((row) => `${row.kind === 'left' ? '- ' : row.kind === 'right' ? '+ ' : '  '}${row.text}`).join('\n');
    const file = new File([body || 'empty gudgeon'], 'gudgeon.diff', { type: 'text/plain' });
    const res = await publishLocalFile(file, { caption: 'line hinge', color: '#FF9F0A' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the hinge did not file');
      return;
    }
    setCard(res.embed || shareUrls(res.id).embed);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">gudgeon</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">the hinge between two drafts</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Compare two passages in the tab. Publishing is optional, and it files the hinge as a public text drop so Discord can unfurl it.</p>
        </motion.div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <textarea value={left} onChange={(e) => setLeft(e.target.value)} placeholder="earlier draft" rows={10} className="glass w-full resize-none rounded-3xl px-4 py-3 text-[14px] outline-none placeholder:text-white/30" />
          <textarea value={right} onChange={(e) => setRight(e.target.value)} placeholder="later draft" rows={10} className="glass w-full resize-none rounded-3xl px-4 py-3 text-[14px] outline-none placeholder:text-white/30" />
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass mt-4 rounded-3xl p-4">
          <div className="max-h-72 overflow-auto font-mono text-[12px] leading-6">
            {diff.map((row, i) => (
              <div key={i} className={row.kind === 'left' ? 'text-[#ff6961]' : row.kind === 'right' ? 'text-[#30d158]' : 'text-white/45'}>
                {row.kind === 'left' ? '- ' : row.kind === 'right' ? '+ ' : '  '}{row.text || ' '}
              </div>
            ))}
          </div>
          <button onClick={publish} disabled={busy || (!left && !right)} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-40">{busy ? 'filing…' : 'file the hinge'}</button>
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {card && <p className="mt-3 truncate text-[13px] text-white/70">{card}</p>}
        </motion.div>
      </main>
    </div>
  );
}
