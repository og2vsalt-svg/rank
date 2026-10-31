import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietCascadePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; warn?: string | null; error?: string } | null>(null);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(36);
    setShares(rows);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const publish = async () => {
    if (!files.length) return;
    setBusy(true);
    setResult(null);
    let lastEmbed: string | undefined;
    let lastWarn: string | null = null;
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption || title || file.name,
        color,
        cardTitle: title || file.name,
        meta: { accent: color, source: 'softquietcascade' },
      });
      if (res.ok && res.embed) {
        lastEmbed = res.embed;
        lastWarn = res.warn || null;
      } else if (!res.ok) {
        setResult({ error: res.error || 'could not file' });
        setBusy(false);
        return;
      }
    }
    setResult({ embed: lastEmbed, warn: lastWarn });
    setFiles([]);
    setBusy(false);
    void refresh();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 relative">
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 3 + (i % 4) * 2,
                height: 3 + (i % 4) * 2,
                background: color,
                opacity: 0.22,
                left: `${8 + (i * 12) % 84}%`,
                top: `${10 + (i * 9) % 70}%`,
              }}
              animate={{
                y: [0, 18 + i * 2, 0],
                opacity: [0.12, 0.35, 0.12],
              }}
              transition={{
                duration: 9 + i * 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="relative"
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softquietcascade</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em]">a quiet cascade of what arrives</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            Drop local files with a shared title, caption, and accent light. Soft particles fall and breathe with spring motion on frosted glass. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Prior desks remain intact.
          </p>
        </motion.div>

        <div className="mt-8 space-y-4 relative">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title for the card (optional)"
            className="glass w-full rounded-2xl px-4 py-3 text-[15px] outline-none"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="caption that travels with the share"
            className="glass w-full rounded-2xl px-4 py-3 text-[14px] outline-none"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="your name, optional"
            className="glass w-full rounded-2xl px-4 py-3 text-[14px] outline-none"
          />
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent"
            />
            <span className="text-[13px] text-white/45">accent light</span>
          </div>

          <label className="glass mt-2 block cursor-pointer rounded-3xl p-6 text-center">
            <input
              className="hidden"
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            <div className="text-[14px] text-white/75">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop local files'}
            </div>
            <div className="mt-1 text-[12px] text-white/35">any type · soft warning only</div>
          </label>

          {!!files.length && (
            <ul className="space-y-1.5">
              {files.map((f) => (
                <li key={f.name + f.size} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-2 text-[13px]">
                  <span className="truncate pr-3">{f.name}</span>
                  <span className="shrink-0 text-white/35">{(f.size / 1024).toFixed(0)} kb</span>
                </li>
              ))}
            </ul>
          )}

          {heavy && (
            <p className="text-[13px] text-amber-200/75">large attachments. sending may feel slow. nothing is refused.</p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={!files.length || busy}
            className="w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'filing\u2026' : 'share into the cascade'}
          </motion.button>

          {result?.error && (
            <div className="glass rounded-2xl px-4 py-3 text-[14px] text-red-300">{result.error}</div>
          )}
          {result?.embed && (
            <div className="glass rounded-2xl px-4 py-3">
              <p className="text-[14px] font-medium">cascade link</p>
              <p className="mt-1.5 break-all text-[12px] text-white/40">{result.embed}</p>
              {result.warn && <p className="mt-1 text-[12px] text-amber-200/70">{result.warn}</p>}
            </div>
          )}
        </div>

        <div className="mt-12 relative">
          <p className="text-[12px] uppercase tracking-wider text-white/35">recent arrivals</p>
          {loading && <p className="mt-4 text-[14px] text-white/40">gathering…</p>}
          <div className="mt-4 space-y-3">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={shareUrls(s.id).embed}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 100, damping: 16 }}
                className="glass block rounded-2xl px-4 py-3 hover:bg-white/[0.05] transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] font-medium">{s.name || 'untitled'}</p>
                  <span className="shrink-0 text-[11px] text-white/35">{s.size ? `${(s.size / 1024).toFixed(0)} kb` : ''}</span>
                </div>
                {s.caption && <p className="mt-1 line-clamp-1 text-[12px] text-white/50">{s.caption}</p>}
                <p className="mt-1 text-[11px] text-white/30">{s.author || 'anonymous'}</p>
              </motion.a>
            ))}
          </div>
          {!loading && !shares.length && (
            <p className="mt-8 text-center text-[14px] text-white/40">the cascade is still. share something to begin.</p>
          )}
        </div>
      </main>
    </div>
  );
}
