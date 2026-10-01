import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function linesOf(s: string) {
  return s.replace(/\r\n/g, '\n').split('\n');
}

export default function FuttockPage() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState('');
  const [err, setErr] = useState('');

  const diff = useMemo(() => {
    const a = linesOf(left);
    const b = linesOf(right);
    const n = Math.max(a.length, b.length);
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      if (a[i] === b[i]) continue;
      out.push(`- ${a[i] ?? ''}`);
      out.push(`+ ${b[i] ?? ''}`);
    }
    return out.join('\n');
  }, [left, right]);

  const ship = async () => {
    setErr('');
    if (!diff) {
      setErr('the two drafts already match');
      return;
    }
    setBusy(true);
    const file = new File([`# futtock\n\n\`\`\`diff\n${diff}\n\`\`\`\n`], 'futtock.md', { type: 'text/markdown' });
    const res = await publishLocalFile(file, { caption: 'a difference of two drafts' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not publish');
      return;
    }
    setId(res.id);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">futtock</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">set two drafts against each other</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Comparison stays in the tab. Publish only if you want the difference as a Discord card.
          </p>
        </motion.div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <textarea value={left} onChange={(e) => setLeft(e.target.value)} rows={10} placeholder="earlier" className="glass rounded-3xl px-4 py-3 text-[14px] outline-none" />
          <textarea value={right} onChange={(e) => setRight(e.target.value)} rows={10} placeholder="later" className="glass rounded-3xl px-4 py-3 text-[14px] outline-none" />
        </div>
        <pre className="glass mt-4 max-h-56 overflow-auto rounded-3xl p-4 text-[12px] leading-relaxed text-white/70">{diff || 'no difference yet'}</pre>
        <button onClick={ship} disabled={busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black active:scale-[0.98] disabled:opacity-60">
          {busy ? 'shipping…' : 'publish the difference'}
        </button>
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
        {id && <p className="mt-3 break-all text-[13px] text-white/70">{shareUrls(id).embed}</p>}
      </main>
    </div>
  );
}
