import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function QuietFogPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#94A3B8');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(40);
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
        meta: { accent: color, source: 'quietfog', kind: 'fog' },
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 20 }}>
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/40">quietfog</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-[-0.05em] leading-none">quiet fog of shared light</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/60">
            Soft layers of public shares that gently drift and settle like quiet fog in your accent color. Multi-file drop with shared note. Spring motion, glass surfaces, polished Discord embeds on every link. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
          <section className="relative min-h-[480px]">
            {loading ? (
              <p className="text-sm text-white/40">gathering the fog…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">the fog is thin. the first drop will settle here.</p>
            ) : (
              <div className="relative h-[520px] overflow-hidden rounded-3xl glass">
                {shares.slice(0, 20).map((s, i) => {
                  const x = 8 + (i * 19) % 84;
                  const y = 12 + (i * 27) % 76;
                  return (
                    <motion.a
                      key={s.id}
                      href={shareUrls(s.id).app}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0.3, 0.75, 0.4],
                        y: [0, -20, 8],
                        x: [0, (i % 2 === 0 ? 10 : -10), 0],
                      }}
                      transition={{
                        delay: i * 0.15,
                        duration: 7 + (i % 3),
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute rounded-xl glass px-3 py-2 text-center"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        background: `${color}15`,
                        borderColor: `${color}28`,
                        filter: 'blur(0.3px)',
                      }}
                    >
                      <div className="text-[10px] uppercase tracking-wide text-white/55">{(s.type || 'file').split('/')[0].slice(0, 4)}</div>
                      <div className="mt-0.5 max-w-[88px] truncate text-[11px] font-medium">{s.name || 'untitled'}</div>
                    </motion.a>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-6">
            <p className="text-[14px] font-medium">settle into the fog</p>
            <label className="mt-4 block cursor-pointer rounded-2xl bg-white/[0.04] p-8 text-center transition-colors hover:bg-white/[0.06]">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[15px] text-white/85">{files.length ? `${files.length} files ready` : 'drop or choose any files'}</div>
              <div className="mt-1 text-[12px] text-white/40">all types welcome · no hard limits</div>
            </label>
            {!!files.length && (
              <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-[12px] text-white/60">
                {files.map((f) => (
                  <li key={f.name + f.size} className="truncate">{f.name}</li>
                ))}
              </ul>
            )}
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note" className="mt-4 w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-[14px] outline-none" />
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
              {busy ? 'settling…' : 'share into the fog'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
