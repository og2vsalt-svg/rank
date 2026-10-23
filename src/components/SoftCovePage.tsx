import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftCovePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#64D2FF');
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
        meta: { accent: color, source: 'softcove', kind: 'cove', fadeHours: hours || null },
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

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 18 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softcove</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] leading-tight">quiet cove of shared light</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Soft floating cards that gently bob on still water. Drop local files to let them settle into storage and the public_shares table. Optional hours until the light fades. Spring motion, glass surfaces, polished Discord embeds on every link. Large files warned, never refused.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section className="relative min-h-[420px] overflow-hidden rounded-3xl bg-white/[0.02] p-4">
            {loading ? (
              <p className="text-sm text-white/40">gathering the cove…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">no public shares yet. the first drop will drift in.</p>
            ) : (
              <div className="relative h-full">
                {shares.slice(0, 18).map((s, i) => {
                  const left = 8 + (i % 6) * 15;
                  const top = 12 + Math.floor(i / 6) * 28;
                  return (
                    <motion.a
                      key={s.id}
                      href={shareUrls(s.id).embed}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: [0, -6, 0],
                        transition: {
                          y: { duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 },
                          opacity: { delay: i * 0.04 },
                        },
                      }}
                      className="absolute glass rounded-2xl p-3 w-[140px] shadow-lg"
                      style={{ left: `${left}%`, top: `${top}%` }}
                    >
                      {s.type?.startsWith('image/') && (
                        <img src={s.fileUrl || s.url} alt="" className="mb-2 h-16 w-full rounded-xl object-cover" />
                      )}
                      <p className="truncate text-[12px] font-medium">{s.name || 'untitled'}</p>
                      {s.caption && <p className="mt-0.5 line-clamp-2 text-[10px] text-white/45">{s.caption}</p>}
                    </motion.a>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">drop into the cove</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} files ready` : 'drop or choose files'}</div>
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
            <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="hours until fade (optional)" type="number" min="0" className="mt-2 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none" />
            {heavy && <p className="mt-2 text-[12px] text-amber-200/80">large batch. encoding or sending may feel slow. nothing is refused.</p>}
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
    </div>
  );
}
