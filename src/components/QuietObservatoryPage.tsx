import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function QuietObservatoryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#A78BFA');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<CloudMeta | null>(null);
  const [orbit, setOrbit] = useState(0);

  const points = useMemo(() => shares.slice(0, 36), [shares]);
  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(60);
    setShares(rows);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(() => setOrbit((o) => (o + 0.4) % 360), 40);
    return () => clearInterval(id);
  }, []);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setStatus('');
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'quietobservatory', kind: 'observatory' },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
    }
    setFiles([]);
    setBusy(false);
    await refresh();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 18 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">quietobservatory</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] leading-tight">quiet celestial chart of shared light</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Points of what has been shared drift in gentle orbits. Drop local files to place new stars in the chart. Soft spring motion, glass surfaces, professional Discord embeds on every link. Large files warned, never refused.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section className="relative min-h-[420px] overflow-hidden rounded-3xl glass">
            {loading ? (
              <p className="absolute inset-0 grid place-items-center text-sm text-white/40">aligning the chart…</p>
            ) : !points.length ? (
              <p className="absolute inset-0 grid place-items-center text-sm text-white/40">the sky is empty. the first drop will appear as a star.</p>
            ) : (
              <div className="absolute inset-0">
                {points.map((s, i) => {
                  const angle = ((i * 137.5 + orbit) % 360) * (Math.PI / 180);
                  const radius = 40 + (i % 8) * 18;
                  const x = 50 + Math.cos(angle) * (radius / 2);
                  const y = 50 + Math.sin(angle) * (radius / 2);
                  return (
                    <motion.button
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ left: `${x}%`, top: `${y}%`, background: s.color || color }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.9 }}
                      whileHover={{ scale: 1.6 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 14, delay: i * 0.02 }}
                      title={s.name || 'shared'}
                    />
                  );
                })}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">place a star</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} ready` : 'drop or choose files'}</div>
              <div className="mt-1 text-[11px] text-white/40">any type accepted</div>
            </label>
            {!!files.length && (
              <ul className="mt-3 space-y-1 text-[12px] text-white/60">
                {files.map((f) => (
                  <li key={f.name + f.size} className="truncate">{f.name}</li>
                ))}
              </ul>
            )}
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note" className="mt-3 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none" />
            <div className="mt-2 flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
              <span className="text-[12px] text-white/45">accent</span>
            </div>
            {heavy && <p className="mt-2 text-[12px] text-amber-200/80">large batch. encoding or sending may feel slow. nothing is refused.</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={!files.length || busy}
              className="mt-3 w-full rounded-full px-4 py-2.5 text-[14px] font-medium text-black disabled:opacity-40"
              style={{ background: color }}
            >
              {busy ? 'placing…' : 'share into the chart'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className="max-w-md overflow-hidden rounded-3xl glass p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[16px] font-medium">{selected.name || 'shared light'}</p>
              {selected.caption && <p className="mt-1 text-[13px] text-white/60">{selected.caption}</p>}
              <a href={shareUrls(selected.id).embed} className="mt-4 inline-block text-[13px] text-[#A78BFA] underline-offset-2 hover:underline">open share link</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
