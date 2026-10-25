import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietHorizonBoardPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5EEAD4');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(20);
    setShares(list);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
    const large = dropped.some(f => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'Some files are large. Uploads may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected]);
    const large = selected.some(f => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'Some files are large. Uploads may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const pin = async () => {
    if (!files.length) return setErr('drop some local files');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'pinned on the quiet horizon',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'quiethorizonboard' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one file slowed');
      }
      setLinks(newLinks);
      setFiles([]);
      setCaption('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something quieted the board');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="glass rounded-[32px] p-8 mb-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Horizon Board</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">A still horizon of shared things.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Pin local files to a quiet horizontal board. Each lands in storage and the public_shares table. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-white/15 rounded-[24px] p-8 text-center mb-5 hover:border-white/30 transition cursor-pointer"
            onClick={() => document.getElementById('board-input')?.click()}
          >
            <p className="text-neutral-300 text-[15px]">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to pin` : 'Drop local files here, or click to choose'}</p>
            <input id="board-input" type="file" multiple className="hidden" onChange={onFile} />
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {files.map((f, i) => (
                <span key={i} className="text-[12px] px-3 py-1 rounded-full bg-white/10 text-neutral-300">{f.name}</span>
              ))}
            </div>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared note for the horizon…"
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent for the pins</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={pin}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-4 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Pinning…' : 'Pin to the horizon'}
          </motion.button>

          <AnimatePresence>
            {links.map((l, i) => (
              <motion.a
                key={l}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                href={l}
                className="block mt-3 text-[13px] break-all"
                style={{ color: accent }}
              >
                {l}
              </motion.a>
            ))}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div>
          <h2 className="text-[13px] uppercase tracking-widest text-neutral-500 mb-6">Horizon board</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 80, damping: 14, delay: i * 0.04 }}
                whileHover={{ scale: 1.03, y: -6 }}
                className="glass flex-shrink-0 w-64 rounded-[22px] p-5 shadow-lg snap-start"
                style={{ borderLeft: `3px solid ${s.color || accent}` }}
              >
                <p className="font-medium text-white text-[15px] truncate">{s.name || s.cardTitle || 'untitled'}</p>
                {s.caption && <p className="text-neutral-400 text-[13px] mt-2 line-clamp-3">{s.caption}</p>}
                <span className="text-[11px] text-neutral-500 block mt-3">{s.size ? Math.round(s.size / 1024) + ' kb' : ''}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
