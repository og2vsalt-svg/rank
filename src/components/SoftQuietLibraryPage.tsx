import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietLibraryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [hours, setHours] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(36);
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
    const expiresAt = hours && Number(hours) > 0 ? new Date(Date.now() + Number(hours) * 3600 * 1000).toISOString() : null;
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || file.name,
        color,
        cardTitle: caption || file.name,
        expiresAt,
        meta: { accent: color, source: 'softquietlibrary', kind: 'library', fadeHours: hours || null },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
    }
    setFiles([]);
    setHours('');
    setBusy(false);
    await refresh();
  };

  const shelves = useMemo(() => {
    const rows: CloudMeta[][] = [[], [], []];
    shares.slice(0, 24).forEach((s, i) => {
      rows[i % 3].push(s);
    });
    return rows;
  }, [shares]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.05 }}
        >
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/35">softquietlibrary</p>
          <h1 className="mt-2 text-[34px] sm:text-[40px] font-semibold tracking-[-0.04em] leading-[1.05]">quiet library of shared pages</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Books settle onto warm wooden shelves with gentle spring motion. Drop local files to add them to the stacks. Optional hours until they quietly leave. Frosted glass, Apple-style pacing, polished Discord embeds on every link. Large files only receive a soft warning of slowness — nothing is refused.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section className="relative min-h-[520px] overflow-hidden rounded-[28px] bg-white/[0.018] p-5 sm:p-7">
            {loading ? (
              <p className="text-sm text-white/40">opening the stacks…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">the shelves are empty. the first volume will find a quiet place.</p>
            ) : (
              <div className="space-y-8">
                {shelves.map((shelf, si) => (
                  <div key={si} className="relative">
                    <div className="absolute inset-x-0 bottom-0 h-[6px] rounded-full bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-900/40" />
                    <div className="flex flex-wrap gap-3 pb-3">
                      {shelf.map((s, i) => (
                        <motion.a
                          key={s.id}
                          href={shareUrls(s.id).embed}
                          initial={{ opacity: 0, y: 20, rotate: (i % 5 - 2) * 1.2 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            rotate: (i % 5 - 2) * 0.8,
                            transition: { type: 'spring', stiffness: 80 + (i % 3) * 10, damping: 14, delay: si * 0.08 + i * 0.04 },
                          }}
                          whileHover={{
                            y: -8,
                            rotate: 0,
                            scale: 1.04,
                            transition: { type: 'spring', stiffness: 300, damping: 18 },
                          }}
                          className="glass relative w-[92px] sm:w-[108px] rounded-xl p-2.5 shadow-lg"
                          style={{ borderTop: `3px solid ${s.color || color}` }}
                        >
                          {s.type?.startsWith('image/') && (
                            <img src={s.fileUrl || s.url} alt="" className="mb-1.5 h-10 w-full rounded-lg object-cover" />
                          )}
                          <p className="truncate text-[10px] sm:text-[11px] font-medium leading-tight">{s.name || 'untitled'}</p>
                          {s.caption && <p className="mt-0.5 line-clamp-2 text-[9px] text-white/40">{s.caption}</p>}
                        </motion.a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-[28px] p-5">
            <p className="text-[13px] font-medium">shelve a volume</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center transition hover:bg-white/[0.06]">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} files ready` : 'drop or choose files'}</div>
              <div className="mt-1 text-[11px] text-white/40">any type, any size</div>
            </label>
            {!!files.length && (
              <ul className="mt-3 space-y-1 text-[12px] text-white/60">
                {files.map((f) => (
                  <li key={f.name + f.size} className="truncate">{f.name}</li>
                ))}
              </ul>
            )}
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="spine note or title"
              className="mt-3 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none placeholder:text-white/30"
            />
            <div className="mt-2 flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
              <span className="text-[12px] text-white/45">spine accent</span>
            </div>
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="hours until it leaves (optional)"
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none"
            />
            {heavy && (
              <p className="mt-2 text-[12px] text-amber-200/80">large collection. sending may feel slow. nothing is refused.</p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={!files.length || busy}
              className="mt-3 w-full rounded-full px-4 py-2.5 text-[14px] font-medium text-black disabled:opacity-40"
              style={{ background: color }}
            >
              {busy ? 'settling onto the shelf…' : 'add to the library'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
