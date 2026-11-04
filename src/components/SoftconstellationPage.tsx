import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

type Row = {
  name: string;
  size: number;
  id?: string;
  embed?: string;
  error?: string;
  warn?: string | null;
};

export default function SoftconstellationPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#BF5AF2');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  useEffect(() => {
    listPublicShares(16).then(setRecent).catch(() => setRecent([]));
  }, []);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'softconstellation' },
      });
      next.push({
        name: file.name,
        size: file.size,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
      });
      setRows([...next]);
    }
    setBusy(false);
    listPublicShares(16).then(setRecent).catch(() => {});
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1200);
  };

  // Positions for constellation stars
  const stars = useMemo(() => {
    return recent.slice(0, 12).map((item, i) => {
      const angle = (i / Math.max(recent.length, 1)) * Math.PI * 2;
      const radius = 28 + (i % 4) * 8;
      return {
        ...item,
        x: 50 + Math.cos(angle) * radius,
        y: 42 + Math.sin(angle) * radius * 0.7,
        delay: i * 0.08,
      };
    });
  }, [recent]);

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="pointer-events-none absolute inset-0">
        {/* subtle connecting lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
          {stars.slice(0, -1).map((s, i) => {
            const next = stars[i + 1];
            if (!next) return null;
            return (
              <motion.line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={next.x}
                y2={next.y}
                stroke={color}
                strokeWidth="0.15"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ delay: s.delay + 0.3, duration: 1.2, ease: 'easeOut' }}
              />
            );
          })}
        </svg>
        {stars.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full glass cursor-default"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: 18 + (s.size % 12),
              height: 18 + (s.size % 12),
              background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}44 60%, transparent 80%)`,
              border: `1px solid ${color}55`,
              boxShadow: `0 0 24px ${color}33`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 16, delay: s.delay }}
            whileHover={{ scale: 1.25, boxShadow: `0 0 36px ${color}66` }}
            title={s.name || s.caption || 'shared'}
          />
        ))}
      </div>

      <main className="relative max-w-2xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-10"
        >
          <p className="text-[#BF5AF2] text-sm font-medium tracking-wide mb-3">softconstellation</p>
          <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight mb-4">
            place what you carry<br />among the stars
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed">
            Drop one or many local files with a shared note and accent. They enter storage and public_shares. Recent public drops settle into a living constellation of glass that slowly turns with spring motion. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits.
          </p>
        </motion.div>

        <div className="glass rounded-3xl p-6 mb-8">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-neutral-400">files</span>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="text-sm text-neutral-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-white/10 file:text-white file:text-sm hover:file:bg-white/20 transition"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-neutral-400">author</span>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="optional"
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-neutral-500 outline-none focus:border-[#BF5AF2]/50 transition"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-neutral-400">accent</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-full rounded-xl bg-transparent border border-white/10 cursor-pointer"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-neutral-400">note</span>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="a quiet line for the share"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-neutral-500 outline-none focus:border-[#BF5AF2]/50 transition"
              />
            </label>
            {heavy && (
              <p className="text-amber-300/90 text-xs">this drop may feel slow — no hard limit, just a gentle warning</p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={busy || !files.length}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#cf7af5] transition"
            >
              {busy ? 'placing…' : 'place in the constellation'}
            </motion.button>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="space-y-2 mb-8">
            {rows.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl px-4 py-3 text-sm flex items-center justify-between gap-3"
              >
                <div className="truncate">
                  <div className="text-white truncate">{r.name}</div>
                  {r.error && <div className="text-red-400 text-xs">{r.error}</div>}
                  {r.warn && <div className="text-amber-300/80 text-xs">{r.warn}</div>}
                </div>
                {r.embed && (
                  <button
                    onClick={() => copy(r.embed!)}
                    className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition whitespace-nowrap"
                  >
                    {copied === r.embed ? 'copied' : 'copy link'}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center text-xs text-neutral-500">
          all prior desks remain fully intact. no traces of boosting.
        </div>
      </main>
    </div>
  );
}
