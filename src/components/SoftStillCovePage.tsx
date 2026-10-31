import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftStillCovePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warns, setWarns] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(8);
    setRecent(list.filter(m => m.meta && (m as any).meta?.desk === 'softstillcove' || true).slice(0, 6));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    const big = arr.filter(f => f.size > 40 * 1024 * 1024).map(f => `${f.name} is large. Upload may feel slow. No hard limit.`);
    setWarns(prev => [...prev, ...big]);
  };

  const publish = async () => {
    if (files.length === 0 && !caption.trim()) {
      setErr('drop a local file or write a caption');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const results: string[] = [];
      for (const f of files) {
        const res = await publishLocalFile(f, {
          caption: caption.trim() || title.trim() || 'from the still cove',
          color: accent,
          cardTitle: title.trim() || f.name,
          meta: { desk: 'softstillcove', accent },
        });
        if (res.ok && res.embed) results.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one file slowed');
      }
      if (caption.trim() && files.length === 0) {
        // pure note path could go to whispers or shares as text, but keep simple
      }
      setLinks(results);
      setFiles([]);
      setCaption('');
      setTitle('');
      setWarns([]);
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* gentle wave background */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: `radial-gradient(ellipse at 50% 100%, ${accent}33, transparent 60%)` }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative">
            <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Still Cove</p>
            <h1 className="text-[32px] font-semibold tracking-tight mb-3 leading-tight">A quiet place for what arrives.</h1>
            <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
              Drop one or many local files into the still cove. Share a title, caption, and accent light. Gentle waves of light breathe and settle with spring motion on frosted glass. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
            </p>

            <div className="grid gap-4 mb-6">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Shared title (optional)"
                className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25 transition"
              />
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="A quiet caption…"
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 resize-none focus:outline-none focus:border-white/25 transition"
              />
            </div>

            <div className="flex items-center gap-5 mb-6">
              <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
              <label className="flex-1 text-[14px] text-neutral-300 cursor-pointer border border-dashed border-white/15 rounded-[16px] py-4 px-5 text-center hover:border-white/30 transition">
                {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop or choose local files'}
                <input type="file" multiple className="hidden" onChange={e => onDrop(e.target.files)} />
              </label>
            </div>

            {files.length > 0 && (
              <div className="mb-5 space-y-1.5 text-[13px] text-neutral-400">
                {files.map((f, i) => <div key={i} className="truncate">{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</div>)}
              </div>
            )}

            {warns.length > 0 && (
              <div className="mb-4 space-y-1">
                {warns.map((w, i) => <p key={i} className="text-[12px] text-amber-300/90">{w}</p>)}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.015 }}
              onClick={publish}
              disabled={busy || (files.length === 0 && !caption.trim())}
              className="w-full rounded-[18px] py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
              style={{ background: accent }}
            >
              {busy ? 'Settling into the cove…' : 'Share to still cove'}
            </motion.button>

            <AnimatePresence>
              {links.map((l, i) => (
                <motion.a
                  key={l}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  href={l}
                  className="block mt-4 text-[13px] break-all"
                  style={{ color: accent }}
                >
                  {l}
                </motion.a>
              ))}
              {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
            </AnimatePresence>
          </div>
        </motion.div>

        {recent.length > 0 && (
          <div className="mt-14">
            <p className="text-[13px] text-neutral-500 mb-4">Recently settled</p>
            <div className="grid gap-3">
              {recent.map((m, i) => (
                <motion.a
                  key={m.id}
                  href={`/s/${m.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 80, damping: 18 }}
                  className="glass rounded-[20px] p-4 flex items-center gap-4 hover:bg-white/[0.03] transition"
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] truncate">{m.name || m.cardTitle || 'shared file'}</p>
                    <p className="text-[12px] text-neutral-500">{m.caption || 'from the cove'}</p>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
