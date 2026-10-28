import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenCovePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<CloudMeta | null>(null);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(32);
    setShares(rows);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
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
        meta: { accent: color, source: 'softlumencove', kind: 'cove' },
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
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softlumencove</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] leading-tight">quiet cove of shared light</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
            A sheltered cove where soft light gathers around what you set down. Drop local files or leave a quiet note. Each settles into storage and the public_shares table with polished Discord embeds on every link. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section>
            {loading ? (
              <p className="text-sm text-white/40">gathering in the cove…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">the cove is quiet. the first share will find shelter here.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {shares.map((s, i) => (
                  <motion.button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02, type: 'spring', stiffness: 140, damping: 16 }}
                    className="glass rounded-3xl overflow-hidden text-left"
                  >
                    {s.type?.startsWith('image/') && s.fileUrl ? (
                      <img src={s.fileUrl} alt={s.name || ''} className="h-36 w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-36 grid place-items-center bg-white/[0.03] text-white/40 text-sm">shared file</div>
                    )}
                    <div className="p-4">
                      <p className="truncate text-[14px] font-medium">{s.name || 'untitled'}</p>
                      {s.caption && <p className="mt-1 line-clamp-2 text-[12px] text-white/50">{s.caption}</p>}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">settle into the cove</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} files ready` : 'drop or choose files'}</div>
              <div className="mt-1 text-[11px] text-white/40">any type · no hard limits</div>
            </label>
            {!!files.length && (
              <ul className="mt-3 space-y-1 text-[12px] text-white/60">
                {files.map((f) => (
                  <li key={f.name + f.size} className="truncate">{f.name}</li>
                ))}
              </ul>
            )}
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="quiet note" className="mt-3 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none" />
            <div className="mt-2 flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
              <span className="text-[12px] text-white/45">accent</span>
            </div>
            {heavy && <p className="mt-2 text-[12px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={!files.length || busy}
              className="mt-3 w-full rounded-full px-4 py-2.5 text-[14px] font-medium text-black disabled:opacity-40"
              style={{ background: color }}
            >
              {busy ? 'settling…' : 'share into the cove'}
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
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-md p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 4 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="max-w-md glass rounded-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[18px] font-medium">{selected.name || 'shared'}</p>
              {selected.caption && <p className="mt-2 text-[14px] text-white/60 leading-relaxed">{selected.caption}</p>}
              <a href={shareUrls(selected.id).embed} className="mt-4 inline-block text-[13px] text-[#AF52DE] underline-offset-2 hover:underline">open share link with Discord embed</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
