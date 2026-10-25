import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftAtelierPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [warns, setWarns] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(18);
    setShares(list);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setWarns(selected.map(f => f.size > 40 * 1024 * 1024 ? `${f.name} is large — upload may feel slow. No hard limit.` : '').filter(Boolean));
    setErr('');
  };

  const publish = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'settled in the soft atelier',
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'softatelier' },
      });
      if (res.ok && res.embed) newLinks.push(res.embed);
      else if (!res.ok) setErr(res.error || 'one file slowed');
    }
    setLinks(newLinks);
    setFiles([]);
    setCaption('');
    await refresh();
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
          className="glass rounded-[32px] p-8 sm:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Atelier</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-2">A quiet studio for what you carry.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop local files. They settle into storage and the public_shares table with a shared note and your accent. Every link carries a polished Discord embed. Soft spring motion, frosted glass. Large files warned gently, never refused. Prior desks remain intact. No traces of boosting.
          </p>

          <div className="mb-6">
            <label className="block text-[13px] text-neutral-300 mb-2">Files</label>
            <input
              type="file"
              multiple
              onChange={onDrop}
              className="w-full text-[14px] text-neutral-300 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-white/20 transition"
            />
            {files.length > 0 && <p className="text-[12px] text-neutral-500 mt-2">{files.length} file{files.length > 1 ? 's' : ''} ready</p>}
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared note for these drops…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent</span>
          </div>

          {warns.length > 0 && (
            <div className="mb-4 space-y-1">
              {warns.map((w, i) => <p key={i} className="text-[12px] text-amber-300/90">{w}</p>)}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : 'Settle into the atelier'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                {links.map((l, i) => (
                  <a key={i} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="mt-14">
          <h2 className="text-[13px] font-medium text-neutral-400 mb-4 tracking-wide">Recent settlements</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, type: 'spring', stiffness: 110, damping: 18 }}
                className="glass rounded-[20px] p-5 block hover:bg-white/5 transition"
              >
                <p className="text-[15px] text-neutral-100 truncate">{s.name || 'untitled'}</p>
                {s.caption && <p className="text-[13px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
                <p className="text-[11px] text-neutral-500 mt-2">{s.size ? `${(s.size / 1024 / 1024).toFixed(1)} MB` : ''} · {s.downloads || 0} arrivals</p>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
