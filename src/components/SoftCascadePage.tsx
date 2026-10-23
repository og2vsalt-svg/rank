import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftCascadePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#67E8F9');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(24);
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
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'softcascade' },
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
    <div className="mesh min-h-screen relative overflow-hidden">
      {/* soft cascading streams */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 h-[160%] w-8 rounded-full opacity-35 blur-xl"
            style={{
              left: `${8 + i * 13}%`,
              background: `linear-gradient(to bottom, transparent, ${color}66, transparent)`,
            }}
            animate={{ y: ['-30%', '40%', '-30%'], opacity: [0.2, 0.5, 0.2] }}
            transition={{
              duration: 14 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      <Navbar />
      <main className="relative mx-auto max-w-5xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 20 }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">softcascade</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">quiet cascading light for what you carry</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
            Soft vertical streams of light that gently fall, pause, and rise again in your accent color, like quiet water over still stone. Multi-file drop with a shared note. Each file lands in storage and the public_shares table with a polished Discord embed. Large files warned, never refused. Spring motion, glass surfaces. Prior desks remain untouched.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            {loading ? (
              <p className="text-sm text-white/40">opening the cascade…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">nothing shared yet. the first drop will appear in the streams.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {shares.map((s, i) => (
                  <motion.a
                    key={s.id}
                    href={shareUrls(s.id).embed}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, type: 'spring', stiffness: 120, damping: 18 }}
                    className="glass block rounded-2xl p-4 hover:bg-white/[0.06] transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-[14px] font-medium">{s.name || s.id}</p>
                      <span className="shrink-0 text-[11px] text-white/40">{((s.size || 0) / 1024).toFixed(0)} kb</span>
                    </div>
                    {s.caption && <p className="mt-1 line-clamp-2 text-[12px] text-white/50">{s.caption}</p>}
                    <p className="mt-2 text-[11px] text-white/30">{s.author || 'anonymous'} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'recent'}</p>
                  </motion.a>
                ))}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">add to the cascade</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} files ready` : 'drop or choose local files'}</div>
              <div className="mt-1 text-[11px] text-white/40">any type · soft warning only</div>
            </label>
            {!!files.length && (
              <ul className="mt-3 space-y-1 text-[12px] text-white/60">
                {files.map((f) => (
                  <li key={f.name + f.size} className="truncate">{f.name}</li>
                ))}
              </ul>
            )}
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note" className="mt-3 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="mt-2 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none" />
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
              {busy ? 'filing…' : 'share into the cascade'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
