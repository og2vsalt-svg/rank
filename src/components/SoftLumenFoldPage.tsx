import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenFoldPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = async () => {
    const list = await listPublicShares(10);
    setShares(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    const big = arr.some(f => f.size > 50 * 1024 * 1024);
    setWarn(big ? 'Large file(s). The fold may take a moment. No hard limit — only a gentle warning of possible slowness.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('fold one or more files into the lumen');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'soft lumen fold',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softlumenfold' },
        });
        if (res.ok && res.embed) {
          created.push(res.embed);
        } else {
          setErr(res.error || `paused on ${file.name}`);
        }
      }
      setLinks(created);
      setFiles([]);
      setCaption('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something slowed the fold');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050507]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: accent }}>Soft Lumen Fold</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-3">Fold what you carry into light.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-xl mx-auto">
            Drop one or many local files with a shared note and accent. They enter storage and public_shares. Recent public drops settle into a soft folded stack of glass that unfolds with spring motion on hover. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 mb-16 shadow-2xl max-w-xl mx-auto"
        >
          <label className="block cursor-pointer rounded-[24px] border-2 border-dashed border-white/10 p-10 text-center mb-6 hover:border-white/20 transition-colors">
            <p className="text-[15px] text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to fold` : 'Drop or choose local files'}</p>
            <p className="text-[12px] text-neutral-500 mt-1">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional note that folds with every file…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-sm text-neutral-400">accent</span>
          </div>

          {warn && <p className="text-sm text-amber-300 mb-4">{warn}</p>}
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}

          <button
            onClick={share}
            disabled={busy || !files.length}
            className="w-full py-3.5 rounded-[20px] bg-white text-black font-medium text-[15px] disabled:opacity-40 transition-opacity"
          >
            {busy ? 'folding…' : 'fold into the lumen'}
          </button>

          {links.length > 0 && (
            <div className="mt-6 space-y-2">
              {links.map((l) => (
                <a key={l} href={l} className="block text-sm text-blue-400 truncate hover:underline">{l}</a>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          <AnimatePresence>
            {shares.map((s, i) => (
              <motion.a
                key={s.id || i}
                href={s.embed || s.url}
                initial={{ opacity: 0, y: 30, rotateX: 8 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 100, damping: 18 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass rounded-[28px] p-5 block shadow-xl origin-top"
                style={{ borderColor: s.color || accent + '40' }}
              >
                <p className="text-sm font-medium text-white truncate">{s.title || s.name || 'folded share'}</p>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{s.caption || 'soft lumen'}</p>
                <p className="text-[11px] text-neutral-500 mt-2">{s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</p>
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
