import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftHarborPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#64D2FF');
  const [expiresIn, setExpiresIn] = useState('');
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
    const expiresAt = expiresIn
      ? new Date(Date.now() + Number(expiresIn) * 3600000).toISOString()
      : null;
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        expiresAt,
        meta: { accent: color, source: 'softharbor' },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
    }
    setFiles([]);
    setExpiresIn('');
    setBusy(false);
    await refresh();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
        >
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">softharbor</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">quiet harbor of shared light</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
            Soft floating docks and gentle waves for what you carry. Multi-file drop with shared note, accent color, and optional hours until the light fades. Each file settles into storage and the public record. Polished Discord embeds on every link. Large files warned, never refused. Spring motion, glass surfaces. Prior desks remain untouched.
          </p>
        </motion.div>

        <div className="mt-8 relative">
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              y: [0, 8, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#64D2FF]/10 to-transparent rounded-full blur-xl" />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px] relative z-10">
            <section>
              {loading ? (
                <p className="text-sm text-white/40">opening the harbor…</p>
              ) : !shares.length ? (
                <p className="text-sm text-white/40">still waters. the first dock will appear here.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {shares.map((s, i) => (
                    <motion.a
                      key={s.id}
                      href={shareUrls(s.id).embed}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 16 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="glass block rounded-3xl p-5 hover:bg-white/[0.05] transition relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute -bottom-4 left-4 right-4 h-8 rounded-full opacity-30"
                        style={{ background: color }}
                        animate={{ scaleX: [0.8, 1.1, 0.8], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="flex items-start justify-between gap-3 relative">
                        <p className="truncate text-[14px] font-medium">{s.name || s.id}</p>
                        <span className="shrink-0 text-[11px] text-white/40">{((s.size || 0) / 1024).toFixed(0)} kb</span>
                      </div>
                      {s.caption && <p className="mt-1 line-clamp-2 text-[12px] text-white/50 relative">{s.caption}</p>}
                      <p className="mt-2 text-[11px] text-white/30 relative">{s.author || 'anonymous'} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'recent'}</p>
                    </motion.a>
                  ))}
                </div>
              )}
            </section>

            <aside className="glass h-fit rounded-3xl p-5 relative">
              <p className="text-[13px] font-medium">moor a file</p>
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
              <input
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="hours until fade, optional"
                className="mt-2 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none"
              />
              {heavy && <p className="mt-2 text-[12px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={send}
                disabled={!files.length || busy}
                className="mt-3 w-full rounded-full px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-40"
                style={{ background: color }}
              >
                {busy ? 'mooring…' : 'share into the harbor'}
              </motion.button>
              {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
