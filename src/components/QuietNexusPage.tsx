import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function QuietNexusPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<CloudMeta | null>(null);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(48);
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
        meta: { accent: color, source: 'quietnexus', kind: 'nexus' },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
    }
    setFiles([]);
    setCaption('');
    setBusy(false);
    await refresh();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 pb-32 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="text-center"
        >
          <p className="text-[12px] uppercase tracking-[0.25em] text-white/35">quietnexus</p>
          <h1 className="mt-3 text-[48px] font-semibold tracking-[-0.06em] leading-none">
            quiet nexus of shared light
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/55">
            A still center where shared files gather as soft points of light. Drop any local files to place them into storage and the public record. Gentle orbital motion, glass surfaces, polished Discord embeds on every link. Large files warned, never refused.
          </p>
        </motion.div>

        {/* Orbital field */}
        <div className="relative mx-auto mt-16 h-[520px] max-w-4xl">
          {loading ? (
            <div className="absolute inset-0 grid place-items-center text-sm text-white/40">gathering light…</div>
          ) : (
            shares.slice(0, 24).map((s, i) => {
              const angle = (i / Math.min(shares.length, 24)) * Math.PI * 2;
              const radius = 160 + (i % 5) * 28;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius * 0.7;
              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, x, y }}
                  transition={{ type: 'spring', stiffness: 60, damping: 14, delay: i * 0.03 }}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                  onClick={() => setSelected(s)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ zIndex: 24 - i }}
                >
                  <div
                    className="glass flex h-16 w-16 items-center justify-center rounded-2xl text-[11px] text-white/80 shadow-lg"
                    style={{ background: s.color ? `${s.color}22` : undefined, borderColor: s.color || undefined }}
                  >
                    <span className="truncate px-1">{(s.caption || s.name || 'file').slice(0, 8)}</span>
                  </div>
                </motion.button>
              );
            })
          )}
          {/* Center orb */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="glass flex h-24 w-24 items-center justify-center rounded-full"
              style={{ background: `${color}18` }}
            >
              <span className="text-[13px] text-white/70">nexus</span>
            </motion.div>
          </div>
        </div>

        {/* Upload panel */}
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18, delay: 0.2 }}
          className="mx-auto mt-12 max-w-md glass rounded-3xl p-6"
        >
          <p className="text-[14px] font-medium">place into the nexus</p>
          <label className="mt-4 block cursor-pointer rounded-2xl bg-white/[0.04] p-7 text-center transition-colors hover:bg-white/[0.07]">
            <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <div className="text-[15px] text-white/85">{files.length ? `${files.length} files ready` : 'drop or choose any files'}</div>
            <div className="mt-1 text-[12px] text-white/40">all types · no hard limits</div>
          </label>
          {!!files.length && (
            <ul className="mt-3 max-h-32 space-y-1 overflow-auto text-[12px] text-white/55">
              {files.map((f) => (
                <li key={f.name + f.size} className="truncate">{f.name}</li>
              ))}
            </ul>
          )}
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared note"
            className="mt-4 w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-[14px] outline-none placeholder:text-white/30"
          />
          <div className="mt-3 flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent</span>
          </div>
          {heavy && <p className="mt-3 text-[12px] text-amber-200/80">large batch. encoding or sending may feel slow. nothing is refused.</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={send}
            disabled={!files.length || busy}
            className="mt-4 w-full rounded-full px-4 py-3 text-[15px] font-medium text-black disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'settling…' : 'share into the nexus'}
          </motion.button>
          {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
        </motion.aside>

        {/* Detail modal */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-5"
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="glass max-w-md rounded-3xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[12px] uppercase tracking-[0.2em] text-white/40">shared light</p>
                <h3 className="mt-2 text-[22px] font-semibold tracking-tight">{selected.caption || selected.name}</h3>
                <p className="mt-1 text-[13px] text-white/50">{selected.size ? `${Math.round(selected.size / 1024)} kb` : ''} · {selected.type}</p>
                <div className="mt-6 flex gap-3">
                  <a
                    href={shareUrls(selected).view}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black"
                  >
                    open
                  </a>
                  <button onClick={() => setSelected(null)} className="rounded-full px-5 py-2.5 text-[14px] text-white/70">
                    close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
