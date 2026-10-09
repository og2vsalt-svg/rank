import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, listPublicShares, markArrival, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function expectedOf(item: CloudMeta) {
  const match = item.caption?.match(/expected\s+(\d+)/i);
  return match ? Number(match[1]) : 0;
}

export default function CampanilePage() {
  const { shareId } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [focus, setFocus] = useState<CloudMeta | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    listPublicShares(60)
      .then((items) => setRows(items.filter((item) => item.author === 'abacus' || item.caption?.startsWith('slab:'))))
      .catch(() => setRows([]));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!shareId) return;
    fetchShare(shareId).then(setFocus).catch(() => setFocus(null));
  }, [shareId]);

  const ring = async (item: CloudMeta) => {
    setBusy(true);
    setNote('');
    const next = await markArrival(item.id);
    setBusy(false);
    if (!next.ok) {
      setNote(next.error || 'the bell stayed quiet. the file is still there.');
      return;
    }
    setNote(`arrival marked · ${next.arrived}`);
    if (focus?.id === item.id) setFocus({ ...item, caption: item.caption });
    load();
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">bell tower</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Campanile</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">The public tower of slabs already laid. Open one, download the file, and mark that you arrived. No new upload on this page. Paste /campanile in Discord for a card. Older desks stay.</p>
        {focus && (
          <motion.article layout className="mt-8 overflow-hidden rounded-3xl border border-[#ff9f0a]/40 bg-white/[0.04]">
            {focus.type?.startsWith('image/') && focus.url && <img src={focus.url} alt="" className="max-h-72 w-full object-cover" />}
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-white/40">slab</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{focus.cardTitle || focus.name}</h2>
              <p className="mt-2 text-sm text-white/60">{focus.caption} · {pretty(Number(focus.size) || 0)}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {focus.url && <a href={focus.url} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">download</a>}
                <button disabled={busy} onClick={() => ring(focus)} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5">{busy ? 'ringing…' : 'mark arrival'}</button>
              </div>
            </div>
          </motion.article>
        )}
        {note && <p className="mt-3 text-sm text-amber-200/80">{note}</p>}
        <ul className="mt-8 space-y-2">
          {rows.map((item, i) => (
            <motion.li key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <a href={`/campanile/${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <span className="truncate">{item.cardTitle || item.name}</span>
                <span className="shrink-0 text-white/40">{expectedOf(item) ? `expect ${expectedOf(item)}` : pretty(item.size)}</span>
              </a>
            </motion.li>
          ))}
          {!rows.length && <li className="text-sm text-white/40">no slabs yet. lay one on the abacus.</li>}
        </ul>
      </main>
    </div>
  );
}
