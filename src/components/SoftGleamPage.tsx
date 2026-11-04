import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftGleamPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#64D2FF');
  const [expires, setExpires] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [lastLinks, setLastLinks] = useState<string[]>([]);

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
    setLastLinks([]);
    const links: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        expiresAt: expires || null,
        meta: { accent: color, source: 'softgleam' },
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

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 18 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softgleam</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] text-white">quiet gleam for what you carry</h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-white/60">
            Drop local files into a soft gleam. Horizontal light streaks gently sweep, pulse, and settle across frosted glass in your accent color. Shared note, optional expiration. Every link unfurls a polished Discord card. Large drops warned, never refused. Spring motion, glass surfaces, human pacing.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section>
            {loading ? (
              <p className="text-sm text-white/40">waiting for the gleam…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">the surface is still. the first drop will gleam here.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shares.map((s, i) => (
                  <motion.a
                    key={s.id}
                    href={shareUrls(s.id).embed}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, type: 'spring', stiffness: 120, damping: 18 }}
                    className="glass block rounded-2xl p-4 hover:bg-white/[0.05] transition relative overflow-hidden"
                  >
                    {[0, 1, 2].map((streak) => (
                      <motion.div
                        key={streak}
                        className="absolute h-[2px] rounded-full opacity-50"
                        style={{
                          width: '40%',
                          background: `linear-gradient(90deg, transparent, ${s.color || color}, transparent)`,
                          top: `${25 + streak * 20}%`,
                          left: '-20%',
                        }}
                        animate={{
                          x: ['0%', '180%'],
                          opacity: [0, 0.6, 0],
                        }}
                        transition={{
                          duration: 4 + streak,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: streak * 0.8,
                        }}
                      />
                    ))}
                    <div className="relative z-10">
                      <p className="truncate text-[14px] font-medium text-white">{s.name}</p>
                      <p className="mt-1 truncate text-[12px] text-white/50">{s.caption || 'shared gleam'}</p>
                      <p className="mt-2 text-[11px] text-white/30">{(s.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </section>

          <aside className="glass rounded-3xl p-6">
            <h2 className="text-[17px] font-medium text-white">drop into the gleam</h2>
            <label className="mt-5 block text-[12px] text-white/50">files</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="mt-1 w-full text-[13px] text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[12px] file:text-white"
            />
            {files.length > 0 && (
              <p className="mt-2 text-[12px] text-white/40">{files.length} file{files.length > 1 ? 's' : ''} ready</p>
            )}
            {heavy && (
              <p className="mt-2 text-[12px] text-amber-300/80">this drop may feel slow — no hard limit</p>
            )}
            <label className="mt-4 block text-[12px] text-white/50">note</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="quiet note that travels with the files"
              className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/30"
            />
            <label className="mt-4 block text-[12px] text-white/50">accent</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 h-9 w-full rounded-xl border-0 bg-transparent"
            />
            <label className="mt-4 block text-[12px] text-white/50">author (optional)</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="who left this"
              className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/30"
            />
            <label className="mt-4 block text-[12px] text-white/50">expires (optional)</label>
            <input
              type="datetime-local"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-[13px] text-white outline-none"
            />
            <button
              onClick={send}
              disabled={busy || !files.length}
              className="mt-6 w-full rounded-2xl bg-white py-3 text-[14px] font-medium text-black disabled:opacity-40"
            >
              {busy ? 'settling…' : 'share the gleam'}
            </button>
            {status && <p className="mt-3 text-[12px] text-red-300">{status}</p>}
            {lastLinks.length > 0 && (
              <div className="mt-4 space-y-1">
                {lastLinks.map((l) => (
                  <a key={l} href={l} className="block truncate text-[12px] text-[#64D2FF] underline">
                    {l}
                  </a>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
