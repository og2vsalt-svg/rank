import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function OgeePage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [rise, setRise] = useState('');
  const [fall, setFall] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<CloudMeta | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'this curve is carrying a large file. the tab may feel slow. nothing is refused for size.' : ''),
    [file],
  );

  const load = () => {
    listPublicShares(40)
      .then((rows) => setRecent(rows.filter((item) => item.caption?.includes('rise:') || item.author === 'ogee')))
      .catch(() => setRecent([]));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/share?id=${encodeURIComponent(shareId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRow(data && data.id ? data : null))
      .catch(() => setRow(null));
  }, [shareId]);

  const bend = async () => {
    if (!file || !rise.trim() || !fall.trim()) return;
    setBusy(true);
    setErr('');
    const published = await publishLocalFile(file, {
      caption: `rise: ${rise.trim()} · fall: ${fall.trim()}`,
      author: 'ogee',
      color: '#64D2FF',
      cardTitle: `${rise.trim()} — ogee`,
      meta: { kind: 'ogee', rise: rise.trim(), fall: fall.trim() },
    });
    setBusy(false);
    if (!published.ok || !published.id) {
      setErr(published.error || 'could not bend that curve');
      return;
    }
    setRow(published.meta || null);
    setLink(`${location.origin}/ogee/${published.id}`);
    setWarn(published.warn || slow || '');
    history.pushState(null, '', `/ogee/${published.id}`);
    load();
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">double curve</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Ogee</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">File one local file with a rise and a fall. Bytes go to storage, the curve lands in the share table. Paste /ogee/id in Discord for a card. Large drops are warned, never refused. Older desks stay.</p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-10 text-center transition duration-200 hover:border-[#64d2ff]/70">
            <span className="text-sm text-white/80">{file ? file.name : 'choose a file from this device'}</span>
            <span className="mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'no size cap'}</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
          <input value={rise} onChange={(e) => setRise(e.target.value)} placeholder="the rise" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#64d2ff]" />
          <input value={fall} onChange={(e) => setFall(e.target.value)} placeholder="the fall" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#64d2ff]" />
          <button disabled={!file || !rise.trim() || !fall.trim() || busy} onClick={bend} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] disabled:opacity-40">{busy ? 'bending…' : 'bend the curve'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
          {link && <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#b7e8ff]">{link} — copied on click</button>}
        </motion.div>
        {row && (
          <motion.article layout className="mt-6 overflow-hidden rounded-3xl border border-[#64d2ff]/40 bg-white/[0.04]">
            {row.type?.startsWith('image/') && row.url && <img src={row.url} alt="" className="max-h-72 w-full object-cover" />}
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-white/40">ogee</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{row.cardTitle || row.name}</h2>
              <p className="mt-2 text-sm text-white/60">{row.caption || 'no curve note'} · {pretty(Number(row.size) || 0)}</p>
              {row.url && <a href={row.url} className="mt-3 inline-block text-sm text-[#b7e8ff]">download {row.name}</a>}
            </div>
          </motion.article>
        )}
        <ul className="mt-8 space-y-2">
          {recent.map((item, i) => (
            <motion.li key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <a href={`/ogee/${item.id}`} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]"><span>{item.name}</span><span className="text-white/40">{pretty(item.size)}</span></a>
            </motion.li>
          ))}
        </ul>
      </main>
    </div>
  );
}
