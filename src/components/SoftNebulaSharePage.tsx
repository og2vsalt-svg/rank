import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftNebulaSharePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id?: string; embed?: string; error?: string; warn?: string | null; name: string }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const nebulaParticles = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  useEffect(() => {
    listPublicShares(10).then(setRecent).catch(() => {});
  }, []);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const shareAll = async () => {
    if (!files.length) return;
    setBusy(true);
    const outs: typeof results = [];
    for (const file of files) {
      const warn = file.size > 35 * 1024 * 1024 ? 'large drop may feel slow while uploading. never refused.' : null;
      const res = await publishLocalFile(file, {
        caption: note || file.name,
        color: accent,
        cardTitle: file.name,
        meta: { accent, source: 'softnebulashare', kind: 'nebula' },
      });
      outs.push({
        name: file.name,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn || warn,
      });
    }
    setResults(outs);
    setBusy(false);
    setFiles([]);
    listPublicShares(10).then(setRecent).catch(() => {});
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/40">softnebulashare</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-[-0.045em] leading-none">a quiet nebula.</h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/60">
            Drop one or many local files with a shared note and accent. Soft clouds of light drift and settle with spring motion on deep navy glass. Recent public drops surface as quiet cards that gather in the nebula. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <div
          className="mt-10 glass rounded-[32px] p-8 text-center border border-white/10 relative overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
        >
          <div className="absolute inset-0 pointer-events-none">
            {nebulaParticles.map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full blur-md"
                style={{
                  width: 40 + (i % 5) * 20,
                  height: 30 + (i % 4) * 15,
                  background: accent,
                  opacity: 0.08 + (i % 3) * 0.04,
                  left: `${(i * 7) % 90}%`,
                  top: `${(i * 11) % 80}%`,
                }}
                animate={{ x: [0, 10, -5, 0], y: [0, -8, 4, 0], opacity: [0.06, 0.12, 0.06] }}
                transition={{ duration: 8 + (i % 4), repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              />
            ))}
          </div>
          <input type="file" multiple className="hidden" id="nebula-input" onChange={(e) => onDrop(e.target.files)} />
          <label htmlFor="nebula-input" className="cursor-pointer block relative z-10">
            <motion.div whileHover={{ scale: 1.02 }} className="text-white/70">
              <p className="text-lg">drop files into the nebula</p>
              <p className="mt-1 text-sm text-white/40">or click to browse · large files warned, never blocked</p>
            </motion.div>
          </label>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex flex-wrap justify-center gap-3 relative z-10">
                {files.map((f, i) => (
                  <motion.div
                    key={f.name + i}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="glass px-3 py-1.5 rounded-full text-xs"
                    style={{ borderColor: accent }}
                  >
                    {f.name} · {(f.size / 1024 / 1024).toFixed(1)}mb
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 space-y-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="shared note (optional)"
            className="glass w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none"
          />
          <div className="flex items-center gap-3">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">nebula accent</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={shareAll}
          disabled={!files.length || busy}
          className="mt-6 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
          style={{ background: accent }}
        >
          {busy ? 'settling into the nebula…' : `share ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
        </motion.button>

        {results.length > 0 && (
          <div className="mt-8 space-y-3">
            {results.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{r.name}</span>
                  {r.embed && (
                    <button onClick={() => copy(r.embed!)} className="text-xs px-3 py-1 rounded-full bg-white/10">
                      {copied === r.embed ? 'copied' : 'copy link'}
                    </button>
                  )}
                </div>
                {r.embed && <p className="mt-1 text-xs text-white/40 break-all">{r.embed}</p>}
                {r.error && <p className="mt-1 text-xs text-red-300">{r.error}</p>}
                {r.warn && <p className="mt-1 text-xs text-amber-200/70">{r.warn}</p>}
              </motion.div>
            ))}
          </div>
        )}

        {recent.length > 0 && (
          <div className="mt-12">
            <p className="text-xs uppercase tracking-wider text-white/40 mb-4">recent nebulae</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recent.map((m) => (
                <motion.a
                  key={m.id}
                  href={shareUrls(m.id).embed}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -2 }}
                  className="glass rounded-2xl p-3 text-left block"
                >
                  <p className="text-sm truncate">{m.name || 'untitled'}</p>
                  <p className="text-xs text-white/40 mt-1">{(m.size / 1024).toFixed(0)}kb</p>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
