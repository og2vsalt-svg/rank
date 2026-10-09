import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile, fetchShare, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function AbacusPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [expected, setExpected] = useState('3');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<CloudMeta | null>(null);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'this slab is carrying a large file. the tab may feel slow. nothing is refused for size.' : ''),
    [file],
  );

  useEffect(() => {
    if (!shareId) return;
    fetchShare(shareId).then(setRow).catch(() => setRow(null));
  }, [shareId]);

  const lay = async () => {
    if (!file || !label.trim()) return;
    const count = Math.max(1, Number(expected) || 1);
    setBusy(true);
    setErr('');
    const published = await publishLocalFile(file, {
      caption: `slab: ${label.trim()} · expected ${count}`,
      author: 'abacus',
      color: '#FF9F0A',
      cardTitle: `${label.trim()} — abacus`,
      meta: { kind: 'abacus', label: label.trim(), expected: count, arrived: 0 },
    });
    setBusy(false);
    if (!published.ok || !published.id) {
      setErr(published.error || 'could not lay that slab');
      return;
    }
    setRow(published.meta || null);
    const next = `${location.origin}/abacus/${published.id}`;
    setLink(next);
    setWarn(published.warn || slow || '');
    history.pushState(null, '', `/abacus/${published.id}`);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">counting slab</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Abacus</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">Lay one local file on a counting slab and say how many arrivals you expect. Bytes go to storage, the tally lands in the share table. People mark arrivals on the campanile, not in a vault drawer. Paste /abacus/id in Discord for a card. Large drops are warned, never refused. Older desks stay.</p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-10 text-center transition duration-200 hover:border-[#ff9f0a]/70">
            <span className="text-sm text-white/80">{file ? file.name : 'choose a file from this device'}</span>
            <span className="mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'no size cap'}</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="what this slab is counting" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#ff9f0a]" />
          <label className="mt-3 block text-xs text-white/40">expected arrivals</label>
          <input value={expected} onChange={(e) => setExpected(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" className="mt-1 w-28 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#ff9f0a]" />
          <button disabled={!file || !label.trim() || busy} onClick={lay} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40">{busy ? 'laying…' : 'lay the slab'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
          {link && <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#ffd60a]">{link} — copied on click</button>}
        </motion.div>
        {row && (
          <motion.article layout className="mt-6 overflow-hidden rounded-3xl border border-[#ff9f0a]/40 bg-white/[0.04]">
            {row.type?.startsWith('image/') && row.url && <img src={row.url} alt="" className="max-h-72 w-full object-cover" />}
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-white/40">abacus</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{row.cardTitle || row.name}</h2>
              <p className="mt-2 text-sm text-white/60">{row.caption || 'no tally note'} · {pretty(Number(row.size) || 0)}</p>
              {row.url && <a href={row.url} className="mt-3 inline-block text-sm text-[#ffd60a]">download {row.name}</a>}
              <a href={`/campanile/${row.id}`} className="mt-3 ml-4 inline-block text-sm text-white/50">open on the campanile</a>
            </div>
          </motion.article>
        )}
      </main>
    </div>
  );
}
