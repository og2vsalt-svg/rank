import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, listPublicShares, publishShare, type CloudMeta } from '../lib/cloudShare';

export default function SoclePage() {
  const { shareId, navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [open, setOpen] = useState<CloudMeta | null>(null);
  const [mark, setMark] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    listPublicShares(48)
      .then((list) => setRows(list.filter((item) => item.author === 'ogee' || (item.caption || '').startsWith('rise:'))))
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    if (!shareId) return;
    fetchShare(shareId).then(setOpen).catch(() => setOpen(null));
  }, [shareId]);

  const setPedestal = async () => {
    if (!open || !mark.trim()) return;
    setBusy(true);
    const id = `socle${Date.now().toString(36)}`;
    const saved = await publishShare({
      id,
      name: `mark on ${open.name || open.id}`,
      type: 'text/plain',
      size: mark.trim().length,
      dataUrl: `data:text/plain,${encodeURIComponent(mark.trim())}`,
      author: 'socle',
      caption: mark.trim(),
    });
    setBusy(false);
    if (!saved.ok) {
      setNote(saved.error || 'could not set that mark');
      return;
    }
    setNote(`mark filed · /socle/${open.id}`);
    setMark('');
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">pedestal</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Socle</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">The public pedestals of ogees already filed. Open one, download the file, leave a short mark. No new upload on this page. Paste /socle in Discord for a card. Older desks stay.</p>
        {open && (
          <motion.article layout className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">open pedestal</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{open.cardTitle || open.name}</h2>
            <p className="mt-2 text-sm text-white/60">{open.caption || 'no curve note'}</p>
            {open.url && <a href={open.url} className="mt-3 inline-block text-sm text-[#b7e8ff]">download the filed file</a>}
            <input value={mark} onChange={(e) => setMark(e.target.value)} placeholder="a mark on the pedestal" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-white/40" />
            <button disabled={!mark.trim() || busy} onClick={setPedestal} className="mt-3 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] disabled:opacity-40">{busy ? 'setting…' : 'set the mark'}</button>
            {note && <p className="mt-3 text-sm text-white/60">{note}</p>}
          </motion.article>
        )}
        <ul className="mt-8 space-y-2">
          {rows.length === 0 && <li className="text-sm text-white/40">no ogees filed yet. bend one on the ogee desk.</li>}
          {rows.map((item, i) => (
            <motion.li key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <button onClick={() => navigate('socle', item.id)} className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]"><span>{item.name}</span><span className="text-white/40">{item.caption?.slice(0, 42) || 'open'}</span></button>
            </motion.li>
          ))}
        </ul>
      </main>
    </div>
  );
}
