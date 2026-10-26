import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenArchivePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [shelf, setShelf] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const refreshRecent = async () => {
    const list = await listPublicShares(12);
    setRecent(list.slice(0, 8));
  };

  useEffect(() => { refreshRecent(); }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) {
      setFiles(prev => [...prev, ...dropped]);
      const big = dropped.some(f => f.size > 40 * 1024 * 1024);
      setWarn(big ? 'Large files may feel slow to upload. No hard limit — only a gentle warning.' : null);
    }
  };

  const share = async () => {
    if (!files.length && !note.trim()) return setErr('Drop a file or leave a note for the archive');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || (shelf.trim() ? `on shelf: ${shelf.trim()}` : 'from the soft lumen archive'),
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softlumenarchive', shelf: shelf.trim() || null },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'upload slowed');
      }
      if (note.trim() && !files.length) {
        const blob = new File([note], 'archive-note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(blob, {
          caption: note.trim(),
          color: accent,
          meta: { desk: 'softlumenarchive', shelf: shelf.trim() || null },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      await refreshRecent();
    } catch (e: any) {
      setErr(e.message || 'something paused');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]" onDragOver={e => e.preventDefault()} onDrop={onDrop}>
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl"
        >
          <p className="text-[12px] font-medium tracking-widest uppercase mb-2" style={{ color: accent }}>Soft Lumen Archive</p>
          <h1 className="text-[32px] font-semibold tracking-tight leading-tight mb-4">Quiet shelves for shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop local files onto a shelf or leave a note. They settle into storage and public_shares. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <div className="border-2 border-dashed border-white/10 rounded-[24px] p-8 mb-6 text-center hover:border-white/20 transition">
            <p className="text-neutral-300 text-[14px] mb-2">Drag files here or click to attach</p>
            <label className="inline-block px-5 py-2 rounded-full bg-white/5 text-[13px] cursor-pointer hover:bg-white/10 transition">
              Choose files
              <input type="file" multiple className="hidden" onChange={e => {
                const selected = Array.from(e.target.files || []);
                setFiles(prev => [...prev, ...selected]);
                setWarn(selected.some(f => f.size > 40*1024*1024) ? 'Large files may feel slow. No hard limit.' : null);
              }} />
            </label>
            {files.length > 0 && (
              <ul className="mt-4 text-left text-[13px] text-neutral-400 space-y-1">
                {files.map((f, i) => <li key={i}>{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</li>)}
              </ul>
            )}
          </div>

          <input
            value={shelf}
            onChange={e => setShelf(e.target.value)}
            placeholder="Optional shelf name…"
            className="w-full bg-black/30 border border-white/10 rounded-[20px] px-5 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25 transition"
          />

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="A quiet note for the archive…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-[20px] px-5 py-4 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Accent color</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/80 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || (!files.length && !note.trim())}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 shadow-xl transition"
            style={{ background: accent }}
          >
            {busy ? 'Settling onto the shelves…' : 'Share into archive'}
          </motion.button>

          <AnimatePresence>
            {links.map(link => (
              <motion.a
                key={link}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                href={link}
                className="block mt-4 text-[13px] break-all hover:underline"
                style={{ color: accent }}
              >
                {link}
              </motion.a>
            ))}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        {recent.length > 0 && (
          <div className="mt-16">
            <h2 className="text-[18px] font-medium mb-6 text-neutral-200">Recent on the shelves</h2>
            <div className="space-y-4">
              {recent.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 90, damping: 16 }}
                  className="glass rounded-[22px] p-5"
                >
                  <p className="text-[15px] font-medium text-neutral-100">{s.name || 'shared light'}</p>
                  {s.caption && <p className="text-[13px] text-neutral-400 mt-1">{s.caption}</p>}
                  <p className="text-[11px] text-neutral-500 mt-2">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
