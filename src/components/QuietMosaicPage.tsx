import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function QuietMosaicPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5EEAD4');
  const [expires, setExpires] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [lastLinks, setLastLinks] = useState<string[]>([]);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(48);
    setShares(rows.filter((s) => s.type?.startsWith('image/') || true)); // show all, prefer images in mosaic
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setStatus('');
    setLastLinks([]);
    const links: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        expiresAt: expires || null,
        meta: { accent: color, source: 'quietmosaic' },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
      if (res.embed) links.push(res.embed);
    }
    setLastLinks(links);
    setFiles([]);
    setBusy(false);
    await refresh();
  };

  const images = shares.filter((s) => String(s.type || '').startsWith('image/'));
  const others = shares.filter((s) => !String(s.type || '').startsWith('image/'));

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 18 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">quietmosaic</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] text-white">a quiet mosaic of shared light</h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-white/60">
            Drop local files into a living mosaic. Images settle into a soft glass grid; other files sit beside them. Shared note, accent color, optional expiration. Every link unfurls a polished Discord card. Large drops warned, never refused. Spring motion, human pacing.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section>
            {loading ? (
              <p className="text-sm text-white/40">opening the mosaic…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">the mosaic is empty. the first drop will land here.</p>
            ) : (
              <>
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {images.map((s, i) => (
                      <motion.a
                        key={s.id}
                        href={shareUrls(s.id).embed}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.015, type: 'spring', stiffness: 140, damping: 16 }}
                        className="group relative aspect-square overflow-hidden rounded-2xl glass"
                      >
                        <img
                          src={s.fileUrl || s.url}
                          alt={s.name || 'shared'}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                          <p className="truncate text-[12px] text-white">{s.name}</p>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                )}
                {others.length > 0 && (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {others.map((s, i) => (
                      <motion.a
                        key={s.id}
                        href={shareUrls(s.id).embed}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02, type: 'spring', stiffness: 120, damping: 18 }}
                        className="glass block rounded-2xl p-4 hover:bg-white/[0.05] transition"
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
              </>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">add to the mosaic</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center transition hover:bg-white/[0.06]">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} files ready` : 'drop or choose local files'}</div>
              <div className="mt-1 text-[11px] text-white/40">images settle in the grid · soft warning only</div>
            </label>
            {!!files.length && (
              <ul className="mt-3 space-y-1 text-[12px] text-white/60">
                {files.map((f) => (
                  <li key={f.name + f.size} className="truncate">{f.name}</li>
                ))}
              </ul>
            )}
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note" className="mt-3 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none focus:bg-white/[0.07]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="mt-2 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none focus:bg-white/[0.07]" />
            <div className="mt-2 flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
              <span className="text-[12px] text-white/45">accent</span>
            </div>
            <input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} className="mt-2 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none" />
            {heavy && <p className="mt-2 text-[12px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={!files.length || busy}
              className="mt-3 w-full rounded-full px-4 py-2.5 text-[14px] font-medium text-black disabled:opacity-40"
              style={{ background: color }}
            >
              {busy ? 'settling…' : 'share into the mosaic'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
            {lastLinks.length > 0 && (
              <div className="mt-3 space-y-1 text-[11px] text-white/50">
                {lastLinks.map((l) => (
                  <a key={l} href={l} className="block truncate hover:text-white">{l}</a>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
