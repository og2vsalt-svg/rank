import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftRibbonPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const ribbon = useMemo(() => shares.slice(0, 36), [shares]);
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
        meta: { accent: color, source: 'softribbon', kind: 'ribbon' },
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
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 18 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softribbon</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] leading-tight">quiet ribbon of shared light</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
            A still vertical ribbon of public shares. Drop local files to let them settle into storage and the public_shares table. Soft spring motion, glass surfaces, polished Discord embeds on every link. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        <div className="mt-10 space-y-6">
          {loading ? (
            <p className="text-sm text-white/40">gathering the ribbon…</p>
          ) : !ribbon.length ? (
            <p className="text-sm text-white/40">no public shares yet. the first drop will appear here.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
              {ribbon.map((s, i) => (
                <motion.a
                  key={s.id}
                  href={shareUrls(s.id).share}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02, type: 'spring', stiffness: 120, damping: 18 }}
                  className="relative mb-4 block pl-10 glass rounded-2xl p-4 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="absolute left-3 top-5 h-2.5 w-2.5 rounded-full bg-white/40 ring-4 ring-[#0b0b0d]" style={{ background: color }} />
                  <p className="truncate text-[14px] font-medium">{s.name || 'untitled'}</p>
                  {s.caption && <p className="mt-1 line-clamp-2 text-[12px] text-white/50">{s.caption}</p>}
                  <p className="mt-2 text-[11px] text-white/30">{s.type || 'file'} · {Math.round((s.size || 0) / 1024)} kb</p>
                </motion.a>
              ))}
            </div>
          )}
        </div>

        <aside className="mt-12 glass rounded-3xl p-5">
          <p className="text-[13px] font-medium">add to the ribbon</p>
          <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center">
            <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <div className="text-[14px] text-white/80">{files.length ? `${files.length} files ready` : 'drop or choose files'}</div>
            <div className="mt-1 text-[11px] text-white/40">any type · soft warning only</div>
          </label>
          {!!files.length && (
            <ul className="mt-3 space-y-1 text-[12px] text-white/60">
              {files.slice(0, 5).map((f) => (
                <li key={f.name} className="truncate">{f.name}</li>
              ))}
              {files.length > 5 && <li className="text-white/40">+{files.length - 5} more</li>}
            </ul>
          )}
          {heavy && <p className="mt-3 text-[12px] text-amber-300/80">large drop — may feel slow, but never refused</p>}
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared note"
            className="mt-4 w-full rounded-xl bg-white/[0.04] px-3 py-2 text-[13px] outline-none placeholder:text-white/30"
          />
          <div className="mt-3 flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded-lg bg-transparent" />
            <span className="text-[12px] text-white/40">accent</span>
          </div>
          <button
            onClick={send}
            disabled={!files.length || busy}
            className="mt-4 w-full rounded-2xl bg-white px-4 py-2.5 text-[13px] font-medium text-black disabled:opacity-40"
          >
            {busy ? 'settling…' : 'drop into ribbon'}
          </button>
          {status && <p className="mt-2 text-[12px] text-red-300/80">{status}</p>}
        </aside>
      </main>
    </div>
  );
}
