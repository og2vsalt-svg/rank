import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function FiferailPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [rows, setRows] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(8).then(setRows).catch(() => setRows([]));
  }, []);

  const slow = useMemo(() => (file && file.size > 24 * 1024 * 1024 ? 'this one is large. the send may feel slow. nothing is refused for size.' : ''), [file]);

  const land = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn('');
    const res = await publishLocalFile(file, {
      caption: caption.trim() || undefined,
      author: author.trim() || 'fiferail',
      cardTitle: file.name,
      color: '#0A84FF',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the rail did not take the file. try again.');
      return;
    }
    setEmbed(res.embed || `${location.origin}/s/${res.id}`);
    setWarn(res.warn || slow);
    const next = await listPublicShares(8).catch(() => rows);
    setRows(next);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] tracking-[0.22em] uppercase text-neutral-500 mb-3">
          file rail
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight text-white mb-3">
          fiferail
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="text-neutral-400 leading-relaxed mb-8 max-w-xl">
          drop a file from this machine. it lands in the share table, then a public card. discord unfurls the link. older desks stay where they are.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-6 mb-6">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center cursor-pointer hover:bg-white/[0.05] transition">
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; setFile(f); setEmbed(''); setErr(''); setWarn(f && f.size > 24 * 1024 * 1024 ? 'large file. preview clients may feel slow. no size gate.' : ''); }} />
            <span className="text-white text-sm font-medium">{file ? file.name : 'choose a local file'}</span>
            <span className="block text-neutral-500 text-xs mt-1">{file ? pretty(file.size) : 'any size. a warning only if it may drag.'}</span>
          </label>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name on the card" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition" />
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="short note" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition" />
          </div>
          {(warn || slow) && <p className="text-amber-200/80 text-xs mt-3">{warn || slow}</p>}
          {err && <p className="text-red-300 text-xs mt-3">{err}</p>}
          <button disabled={!file || busy} onClick={land} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition active:scale-[0.98]">
            {busy ? 'sending…' : 'hang it on the rail'}
          </button>
          {embed && (
            <div className="mt-4 rounded-2xl bg-black/40 border border-white/10 p-4">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">discord card</p>
              <a href={embed} className="text-sm text-white break-all">{embed}</a>
              <button onClick={() => navigator.clipboard.writeText(embed)} className="block mt-3 text-xs text-neutral-300 hover:text-white">copy link</button>
            </div>
          )}
        </motion.div>
        <section>
          <h2 className="text-sm text-neutral-400 mb-3">recent public drops</h2>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <motion.a key={row.id} href={`/s/${row.id}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3 hover:-translate-y-0.5 transition">
                <span className="text-sm text-white truncate">{row.name}</span>
                <span className="text-xs text-neutral-500 shrink-0">{pretty(row.size)}</span>
              </motion.a>
            ))}
            {!rows.length && <p className="text-xs text-neutral-500">nothing public yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
