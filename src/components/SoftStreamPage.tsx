import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftStreamPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5EEAD4');
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
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'softstream', kind: 'stream' },
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
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softstream</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] leading-tight">quiet flowing stream of shared light</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
            A gentle horizontal stream of public shares. Drop local files to let them drift into storage and the public_shares table. Soft spring motion, glass cards that settle as you scroll, professional Discord embeds on every link. Large files warned, never refused.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section className="min-w-0">
            {loading ? (
              <p className="text-sm text-white/40">gathering the stream…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">the stream is still. the first drop will appear here.</p>
            ) : (
              <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-4 snap-x snap-mandatory">
                {shares.map((s, i) => (
                  <motion.a
                    key={s.id}
                    href={shareUrls(s.id).embed}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02, type: 'spring', stiffness: 120, damping: 18 }}
                    className="glass w-64 shrink-0 snap-start rounded-3xl p-4"
                  >
                    {s.type?.startsWith('image/') ? (
                      <img src={s.fileUrl || s.url} alt={s.name || ''} className="mb-3 h-36 w-full rounded-2xl object-cover" loading="lazy" />
                    ) : (
                      <div className="mb-3 grid h-36 place-items-center rounded-2xl bg-white/[0.04] text-[12px] text-white/40">
                        {s.type?.split('/')[1] || 'file'}
                      </div>
                    )}
                    <p className="truncate text-[13px] font-medium">{s.name || 'untitled'}</p>
                    {s.caption && <p className="mt-1 line-clamp-2 text-[11px] text-white/45">{s.caption}</p>}
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-white/30">
                      {s.size ? `${(s.size / 1024 / 1024).toFixed(1)} mb` : 'shared'}
                    </p>
                  </motion.a>
                ))}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">drop into the stream</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} files ready` : 'drop or choose files'}</div>
              <div className="mt-1 text-[11px] text-white/40">any type · large files warned, never refused</div>
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
              {busy ? 'drifting…' : 'share into the stream'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
