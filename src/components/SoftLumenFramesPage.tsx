import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenFramesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<CloudMeta | null>(null);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(12);
    setShares(list.filter(s => s.type?.startsWith('image/') || true));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files || []);
    setFiles(fs);
    const large = fs.some(f => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'Some files are large. The upload may feel slow. No hard limit.' : null);
  };

  const save = async () => {
    if (!files.length && !note.trim()) return setErr('drop files or leave a note');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || `framed in softlumenframes`,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softlumenframes' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one upload slowed');
      }
      if (note.trim() && !files.length) {
        // note-only as text share
        const blob = new Blob([note.trim()], { type: 'text/plain' });
        const file = new File([blob], 'note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(file, {
          caption: note.trim(),
          color: accent,
          cardTitle: 'soft note',
          meta: { desk: 'softlumenframes', noteOnly: true },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something settled slowly');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[28px] p-8 shadow-2xl mb-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Lumen Frames</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Quiet frames for shared light.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            A still gallery desk. Drop local files or leave a note. Soft framed cards settle in your accent, like quiet light held in glass. Files upload to storage and public_shares. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional shared note…"
            rows={3}
            maxLength={280}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <label className="text-[13px] text-neutral-300 cursor-pointer hover:text-white transition">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop local files'}
              <input type="file" multiple className="hidden" onChange={onDrop} />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={save}
            disabled={busy || (!files.length && !note.trim())}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Framing…' : 'Frame and share'}
          </motion.button>

          <AnimatePresence>
            {links.map((l, i) => (
              <motion.a
                key={l}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {shares.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 90, damping: 16 }}
              className="glass rounded-[20px] overflow-hidden cursor-pointer"
              onClick={() => s.type?.startsWith('image/') && setLightbox(s)}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}
            >
              {s.type?.startsWith('image/') && s.fileUrl ? (
                <img src={s.fileUrl} alt={s.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="h-40 flex items-center justify-center text-neutral-500 text-sm">{s.name || 'file'}</div>
              )}
              <div className="p-4">
                <p className="text-[13px] text-white truncate">{s.name}</p>
                {s.caption && <p className="text-[12px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
                <a href={`/s/${s.id}`} className="text-[11px] mt-2 block" style={{ color: accent }}>share link</a>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {lightbox && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center p-6"
              onClick={() => setLightbox(null)}
            >
              <motion.img
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                src={lightbox.fileUrl}
                alt={lightbox.name}
                className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
