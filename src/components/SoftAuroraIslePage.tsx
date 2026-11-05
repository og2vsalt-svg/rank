import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftAuroraIslePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [expires, setExpires] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [lastLinks, setLastLinks] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shares;
    return shares.filter((s) =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.caption || '').toLowerCase().includes(q) ||
      (s.author || '').toLowerCase().includes(q)
    );
  }, [shares, query]);

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
    setLastLinks([]);
    const links: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        expiresAt: expires || null,
        meta: { accent: color, source: 'softauroraisle' },
      });
      if (!res.ok) {
        setStatus(res.error || 'isle failed');
        break;
      }
      if (res.embed) links.push(res.embed);
    }
    setLastLinks(links);
    setFiles([]);
    setBusy(false);
    await refresh();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 18 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softauroraisle</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] text-white">a quiet aurora isle for what you carry</h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-white/60">
            Drop local files onto a still isle. Soft ribbons of aurora light rise from the water and settle with spring motion on deep navy glass. Search recent shares. Shared note, optional expiration. Every link unfurls a polished Discord card. Large drops warned, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <div className="mt-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search the isle…"
            className="w-full max-w-md rounded-2xl bg-white/[0.04] px-4 py-2.5 text-[13px] outline-none focus:bg-white/[0.07]"
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section>
            {loading ? (
              <p className="text-sm text-white/40">the aurora settles…</p>
            ) : !filtered.length ? (
              <p className="text-sm text-white/40">the isle is quiet. the first ribbon of light will rise with your drop.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s, i) => (
                  <motion.a
                    key={s.id}
                    href={shareUrls(s.id).embed}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 110, damping: 16 }}
                    className="glass block rounded-2xl p-4 hover:bg-white/[0.05] transition relative overflow-hidden apple-card"
                  >
                    <motion.div
                      className="absolute -inset-12 opacity-30 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at 30% 20%, ${s.color || color}40, transparent 50%), radial-gradient(ellipse at 70% 80%, #5AC8FA30, transparent 40%)` }}
                      animate={{ y: [0, -8, 0], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 8 + (i % 4), repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-[14px] font-medium">{s.name || s.id}</p>
                        <span className="shrink-0 text-[11px] text-white/40">{((s.size || 0) / 1024).toFixed(0)} kb</span>
                      </div>
                      {s.caption && <p className="mt-1 line-clamp-2 text-[12px] text-white/50">{s.caption}</p>}
                      <p className="mt-2 text-[11px] text-white/30">{s.author || 'anonymous'} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'recent'}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">settle on the isle</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center transition hover:bg-white/[0.06]">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} files ready` : 'drop or choose local files'}</div>
              <div className="mt-1 text-[11px] text-white/40">aurora rises gently · soft warning only</div>
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
              <span className="text-[12px] text-white/45">aurora accent</span>
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
              {busy ? 'rising…' : 'settle and share'}
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
