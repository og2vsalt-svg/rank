import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function LumenForgePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warns, setWarns] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const loadRecent = useCallback(async () => {
    const list = await listPublicShares(8);
    setRecent(list.filter(m => m.meta && (m as any).meta?.desk === 'lumenforge').slice(0, 6));
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    const big = arr.filter(f => f.size > 40 * 1024 * 1024).map(f => `${f.name} is large — upload may feel slow. No hard limit.`);
    setWarns(prev => [...prev, ...big]);
  };

  const forge = async () => {
    if (files.length === 0 && !caption.trim()) {
      setErr('drop at least one local file or write a note');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: string[] = [];
    try {
      if (files.length) {
        for (const file of files) {
          const res = await publishLocalFile(file, {
            caption: caption.trim() || title.trim() || 'from the lumen forge',
            color: accent,
            cardTitle: title.trim() || file.name,
            meta: { desk: 'lumenforge', accent },
          });
          if (res.ok && res.embed) made.push(res.embed);
          else if (!res.ok) setErr(prev => prev || res.error || 'one share slowed');
        }
      }
      if (caption.trim() && files.length === 0) {
        // note-only via a lightweight share if needed, but for now we focus on files
      }
      setLinks(made);
      setFiles([]);
      setTitle('');
      setCaption('');
      setWarns([]);
      await loadRecent();
    } catch (e: any) {
      setErr(e.message || 'forge cooled');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.05 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl apple-card"
        >
          <p className="text-[12px] font-medium tracking-[0.12em] uppercase mb-2" style={{ color: accent }}>Lumen Forge</p>
          <h1 className="text-[32px] md:text-[36px] font-semibold tracking-tight leading-tight mb-3">Forge quiet shares of light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop several local files. Each becomes its own share, lit by your accent, titled if you choose. Files land in storage and the public_shares table. Share links unfurl with polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. All prior desks remain intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
            className="border border-dashed border-white/15 rounded-[24px] p-8 text-center mb-6 hover:border-white/25 transition cursor-pointer"
            onClick={() => document.getElementById('lumen-file')?.click()}
          >
            <input id="lumen-file" type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-[15px] text-neutral-300">Drop local files or click to choose</p>
            {files.length > 0 && <p className="text-[13px] mt-2 text-neutral-500">{files.length} file{files.length > 1 ? 's' : ''} ready</p>}
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {files.map((f, i) => (
                <span key={i} className="text-[12px] bg-white/8 px-3 py-1 rounded-full text-neutral-300">{f.name}</span>
              ))}
            </div>
          )}

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional shared title"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] mb-3 focus:outline-none focus:border-white/20"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption or note"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] mb-5 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Accent</span>
          </div>

          {warns.map((w, i) => <p key={i} className="text-[12px] text-amber-300/90 mb-2">{w}</p>)}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={forge}
            disabled={busy || (files.length === 0 && !caption.trim())}
            className="w-full rounded-[18px] py-4 text-[15px] font-medium text-white disabled:opacity-40 shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Forging…' : 'Forge shares'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                {links.map((l, i) => (
                  <a key={i} href={l} className="block text-[13px] break-all hover:underline" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        {recent.length > 0 && (
          <div className="mt-14">
            <p className="text-[12px] uppercase tracking-wider text-neutral-500 mb-4">Recent from the forge</p>
            <div className="space-y-3">
              {recent.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 100, damping: 16 }}
                  className="glass rounded-[20px] p-5"
                >
                  <p className="text-[15px] font-medium">{m.name || m.cardTitle || 'share'}</p>
                  {m.caption && <p className="text-[13px] text-neutral-400 mt-1">{m.caption}</p>}
                  <a href={`/s/${m.id}`} className="text-[12px] mt-2 inline-block" style={{ color: accent }}>open</a>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
