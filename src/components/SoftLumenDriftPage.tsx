import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenDriftPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#A78BFA');
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
        meta: { accent: color, source: 'softlumendrift', kind: 'drift', fadeHours: hours || null },
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
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softlumendrift</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] leading-tight">quiet drift of shared light</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Soft orbs that gently drift and breathe across a still field. Drop local files to let them settle into storage and the public_shares table. Optional hours until the light fades. Spring motion, glass surfaces, polished Discord embeds on every link. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section>
            {loading ? (
              <div className="text-[13px] text-white/40">gathering light…</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {shares.map((s, i) => {
                  const urls = shareUrls(s);
                  return (
                    <motion.a
                      key={s.id}
                      href={urls.share}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 16 }}
                      className="glass group relative overflow-hidden rounded-3xl p-5 transition hover:bg-white/[0.06]"
                      style={{ borderColor: s.color || '#A78BFA' }}
                    >
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl" style={{ background: s.color || '#A78BFA' }} />
                      <div className="relative">
                        <p className="truncate text-[15px] font-medium">{s.name || 'untitled'}</p>
                        {s.caption && <p className="mt-1 line-clamp-2 text-[13px] text-white/45">{s.caption}</p>}
                        <p className="mt-3 text-[11px] uppercase tracking-wider text-white/30">{new Date(s.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">drop into the drift</p>
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
              {busy ? 'drifting…' : 'share into the drift'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
