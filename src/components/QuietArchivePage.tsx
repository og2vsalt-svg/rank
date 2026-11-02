import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function QuietArchivePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    listPublicShares(36).then(setShares).finally(() => setLoading(false));
  }, []);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    for (const file of files) {
      await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'quietarchive' },
      });
    }
    setFiles([]);
    setCaption('');
    const fresh = await listPublicShares(36);
    setShares(fresh);
    setBusy(false);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 20 }}
          className="max-w-5xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color }}>quietarchive</p>
          <h1 className="text-4xl font-semibold tracking-tight">quiet archive</h1>
          <p className="text-neutral-400 mt-3 max-w-2xl">
            A still place for what has already been shared. Recent public files settle into glass tiles with spring lift on hover. Drop more from this machine — they land in storage and public_shares. Every link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>

          <label className="glass mt-8 block cursor-pointer rounded-[28px] p-10 text-center transition hover:bg-white/[0.03]">
            <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <div className="text-[15px] text-white/85">{files.length ? `${files.length} files ready to archive` : 'choose files from this machine'}</div>
            <div className="mt-1.5 text-[12px] text-white/40">any type · soft warning only</div>
          </label>

          <div className="mt-6 grid gap-3 max-w-xl">
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="note that rides with the archive" className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none" />
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
              <span className="text-[13px] text-white/50">accent</span>
            </div>
          </div>

          {heavy && <p className="mt-3 text-[13px] text-amber-200/85">large batch. sending may feel slow. nothing is refused.</p>}

          <motion.button
            whileTap={{ scale: 0.965 }}
            whileHover={{ scale: 1.012 }}
            onClick={send}
            disabled={!files.length || busy}
            className="mt-5 w-full max-w-xl rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'settling into the archive…' : 'archive these'}
          </motion.button>

          <div className="mt-14">
            <h2 className="text-xl font-medium mb-5">recent shares</h2>
            {loading ? (
              <p className="text-neutral-500">opening the archive…</p>
            ) : shares.length === 0 ? (
              <p className="text-neutral-500">nothing public yet. share something above.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {shares.map((s, i) => {
                  const urls = shareUrls(s.id);
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.4), type: 'spring', stiffness: 110, damping: 18 }}
                      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 280, damping: 22 } }}
                      className="glass rounded-2xl overflow-hidden"
                      style={{ boxShadow: `0 8px 28px ${s.color || color}22` }}
                    >
                      <div className="aspect-square grid place-items-center bg-white/[0.03] text-xs text-neutral-500 p-4 text-center">
                        {s.name}
                      </div>
                      <div className="p-3">
                        <p className="text-sm truncate">{s.name}</p>
                        {s.caption && <p className="text-[11px] text-white/45 mt-0.5 line-clamp-2">{s.caption}</p>}
                        <button onClick={() => copy(urls.embed)} className="mt-2 text-xs text-neutral-400 hover:text-white">
                          {copied === urls.embed ? 'copied' : 'copy share link'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
