import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function QuietPulsePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; warn?: string | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listPublicShares(24);
      setShares(list);
      setErr('');
    } catch (e: any) {
      setErr(e?.message || 'could not load pulse');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onDrop(e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    const files = 'dataTransfer' in e ? e.dataTransfer.files : e.target.files;
    if (!files || !files.length) return;
    const file = files[0];
    if (file.size > 40 * 1024 * 1024) {
      // soft warning only
    }
    setBusy(true);
    setResult(null);
    setErr('');
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || undefined,
        color: accent,
        cardTitle: file.name,
      });
      if (!res.ok) throw new Error(res.error || 'publish failed');
      setResult({ embed: res.embed, warn: res.warn || null });
      setCaption('');
      await load();
    } catch (e: any) {
      setErr(e?.message || 'could not share');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">quiet pulse</p>
          <h1 className="text-4xl font-semibold mb-3 tracking-tight">a living pulse of shares.</h1>
          <p className="text-neutral-400 text-sm mb-8 max-w-xl leading-relaxed">
            Drop a local file. It joins the gentle pulse of recent public shares. Shared caption and accent color. Every link carries a polished Discord embed. Soft size warnings only. No hard limits. Apple-style springs on frosted glass.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="glass rounded-3xl p-6 mb-10 border-dashed border-white/20"
          >
            <label className="block cursor-pointer">
              <input type="file" className="hidden" onChange={onDrop} />
              <p className="text-sm text-neutral-300 mb-3">drop a file or click to choose</p>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="optional shared caption"
                className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/60 transition mb-3"
              />
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-neutral-500">accent</span>
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-8 rounded-lg bg-transparent border-0" />
              </div>
              <button
                disabled={busy}
                className="rounded-full bg-white text-black px-5 py-2 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
              >
                {busy ? 'settling…' : 'publish to the pulse'}
              </button>
            </label>
            {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
            {result?.warn && <p className="text-amber-300 text-sm mt-3">large file. may feel slow. no hard limit.</p>}
            {result?.embed && (
              <p className="text-sm text-neutral-300 mt-3 break-all">
                share link <a href={result.embed} className="text-[#64d2ff]">{result.embed}</a>
              </p>
            )}
          </div>

          {loading && <p className="text-neutral-500 text-sm">feeling the pulse…</p>}
          <div className="space-y-3">
            {shares.map((s, i) => {
              const url = shareUrls(s.id).app;
              return (
                <motion.a
                  key={s.id}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 18, delay: i * 0.03 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="glass rounded-2xl p-4 flex items-center gap-4 block hover:bg-white/[0.06]"
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 2.4 + (i % 5) * 0.2, ease: 'easeInOut' }}
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: s.color || accent }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name || 'untitled'}</p>
                    <p className="text-xs text-neutral-500 truncate">{s.caption || 'shared quietly'}</p>
                  </div>
                  <p className="text-[10px] text-neutral-600 flex-shrink-0">{s.size ? `${(s.size / 1024 / 1024).toFixed(1)} MB` : ''}</p>
                </motion.a>
              );
            })}
          </div>
          {!loading && shares.length === 0 && <p className="text-neutral-500 text-sm mt-6">the pulse is still. drop the first file.</p>}
        </motion.div>
      </div>
    </div>
  );
}
