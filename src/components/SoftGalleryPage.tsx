import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftGalleryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  useEffect(() => {
    listPublicShares(36).then(setShares).finally(() => setLoading(false));
  }, []);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    for (const file of files) {
      await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'softgallery' },
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
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="mb-10 text-center"
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softgallery</p>
          <h1 className="mt-2 text-[42px] font-semibold tracking-[-0.045em]">a living gallery of what you carry</h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
            Recent public shares settle into glass tiles with spring motion. Drop local files to add your own — they land in storage and the public_shares table. Every link unfurls a polished Discord card. Large batches warned only for possible slowness. Nothing refused. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div className="mb-10 grid gap-4 md:grid-cols-[1fr_auto] items-end">
          <label className="glass block cursor-pointer rounded-3xl p-6 text-center">
            <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <div className="text-[15px] text-white/80">{files.length ? `${files.length} files ready to settle` : 'drop or choose files from this machine'}</div>
            <div className="mt-1 text-[12px] text-white/40">any type · soft warning only</div>
          </label>
          <div className="grid gap-3">
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-12 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass flex-1 rounded-2xl px-4 py-3 text-[14px] outline-none" />
            </div>
          </div>
        </div>

        {!!files.length && (
          <ul className="mb-6 space-y-1.5">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-2 text-[13px]">
                <span className="truncate pr-3">{f.name}</span>
                <span className="text-white/40">{(f.size / 1024).toFixed(0)} kb</span>
              </li>
            ))}
          </ul>
        )}

        {heavy && <p className="mb-4 text-center text-[13px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.975 }}
          whileHover={{ scale: 1.005 }}
          onClick={send}
          disabled={!files.length || busy}
          className="mb-12 w-full rounded-full px-6 py-3.5 text-[15px] font-medium text-white disabled:opacity-40 md:w-auto md:mx-auto md:block"
          style={{ background: color }}
        >
          {busy ? 'settling…' : 'add to the gallery'}
        </motion.button>

        {loading ? (
          <div className="text-center text-sm text-white/40">gathering light…</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shares.map((s) => {
              const urls = shareUrls(s.id);
              const isImg = (s.type || '').startsWith('image/');
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6, transition: { type: 'spring', stiffness: 280, damping: 20 } }}
                  className="glass overflow-hidden rounded-3xl"
                >
                  {isImg && s.fileUrl ? (
                    <img src={s.fileUrl} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-white/[0.03] text-white/30 text-sm">file</div>
                  )}
                  <div className="p-4">
                    <p className="truncate text-[15px] font-medium">{s.cardTitle || s.name || 'untitled'}</p>
                    {s.caption && <p className="mt-1 line-clamp-2 text-[13px] text-white/50">{s.caption}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-white/35">{s.author || 'anonymous'}</span>
                      <button onClick={() => copy(urls.embed)} className="rounded-full bg-white/10 px-3 py-1 text-[11px]">
                        {copied === urls.embed ? 'copied' : 'copy link'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
