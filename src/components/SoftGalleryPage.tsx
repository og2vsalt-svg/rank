import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftGalleryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [lightbox, setLightbox] = useState<CloudMeta | null>(null);

  const images = useMemo(() => shares.filter(s => s.type?.startsWith('image/')), [shares]);
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
        meta: { accent: color, source: 'softgallery', kind: 'gallery' },
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
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softgallery</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] leading-tight">quiet frames of shared light</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
            A still gallery of public images. Drop local files to land them in storage and the public_shares table. Soft spring motion, glass surfaces, professional Discord embeds on every link. Large files warned, never refused.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section>
            {loading ? (
              <p className="text-sm text-white/40">gathering frames…</p>
            ) : !images.length ? (
              <p className="text-sm text-white/40">no public images yet. the first drop will appear here.</p>
            ) : (
              <div className="columns-2 gap-3 sm:columns-3 md:columns-4">
                {images.map((s, i) => (
                  <motion.button
                    key={s.id}
                    onClick={() => setLightbox(s)}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.015, type: 'spring', stiffness: 140, damping: 16 }}
                    className="mb-3 block w-full overflow-hidden rounded-2xl glass break-inside-avoid"
                  >
                    <img src={s.fileUrl || s.url} alt={s.name || 'shared'} className="w-full object-cover" loading="lazy" />
                    <div className="p-3 text-left">
                      <p className="truncate text-[13px] font-medium">{s.name || 'untitled'}</p>
                      {s.caption && <p className="mt-0.5 line-clamp-2 text-[11px] text-white/45">{s.caption}</p>}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">add frames</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center">
              <input className="hidden" type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} images ready` : 'drop or choose images'}</div>
              <div className="mt-1 text-[11px] text-white/40">images preferred · any type accepted</div>
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
              {busy ? 'framing…' : 'share into the gallery'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className="max-h-[90vh] max-w-4xl overflow-hidden rounded-3xl glass"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={lightbox.fileUrl || lightbox.url} alt={lightbox.name || ''} className="max-h-[70vh] w-full object-contain" />
              <div className="p-5">
                <p className="text-[16px] font-medium">{lightbox.name || 'shared frame'}</p>
                {lightbox.caption && <p className="mt-1 text-[13px] text-white/60">{lightbox.caption}</p>}
                <a href={shareUrls(lightbox.id).embed} className="mt-3 inline-block text-[12px] text-[#64D2FF] underline-offset-2 hover:underline">open share link</a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
