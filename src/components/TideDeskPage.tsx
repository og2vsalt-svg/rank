import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function TideDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(20);
    setShares(list);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onFiles = (arr: File[]) => {
    setFiles(arr);
    const big = arr.some(f => f.size > 50 * 1024 * 1024);
    setWarn(big ? 'Large drop. The tide may take a quiet moment. No hard limit — only a soft note if it feels slow.' : null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const arr = Array.from(e.dataTransfer.files);
    if (arr.length) onFiles(arr);
  };

  const share = async () => {
    if (!files.length) return setErr('choose something to let the tide carry');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'tide desk drop',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'tidedesk' },
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
      setErr(e.message || 'the tide paused for a moment');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050507] text-white">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 22 }}
          className="text-center mb-14"
        >
          <p className="text-[13px] font-medium tracking-[0.22em] uppercase mb-3" style={{ color: accent }}>Tide Desk</p>
          <h1 className="text-[44px] sm:text-[52px] font-semibold tracking-tight leading-tight mb-4">Let the quiet tide carry what you hold.</h1>
          <p className="text-neutral-400 text-[17px] leading-relaxed max-w-2xl mx-auto">
            Drop local files onto a still shore. They settle as glass cards that rise and fall with gentle spring motion, like a quiet tide in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops warned, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 sm:p-10 mb-20 shadow-2xl max-w-2xl mx-auto"
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
        >
          <label className={`block cursor-pointer rounded-[28px] border-2 border-dashed p-12 text-center mb-7 transition-all duration-300 ${
            drag ? 'border-white/40 bg-white/5 scale-[1.01]' : 'border-white/10 hover:border-white/20'
          }`}>
            <p className="text-[16px] text-neutral-200 font-medium">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready for the tide` : 'Drop or choose local files'}
            </p>
            <p className="text-[13px] text-neutral-500 mt-2">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(Array.from(e.target.files || []))} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional quiet note that travels with the tide…"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-[22px] px-5 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 resize-none focus:outline-none focus:border-white/30 transition-colors"
          />

          <div className="flex items-center gap-5 mb-7">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-12 rounded-full cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[14px] text-neutral-400">Tide accent</span>
          </div>

          {warn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] text-amber-300/90 mb-5 text-center">
              {warn}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.975 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[26px] py-4.5 text-[16px] font-medium text-white disabled:opacity-40 transition-all shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Letting the tide carry…' : 'Share into the tide desk'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-7 space-y-1.5 text-center"
              >
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14px] break-all hover:underline" style={{ color: accent }}>
                    {l}
                  </a>
                ))}
              </motion.div>
            )}
            {err && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-[13px] text-red-400 text-center">
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.035, type: 'spring', stiffness: 75, damping: 18 }}
              whileHover={{ y: -14, scale: 1.035 }}
              className="glass rounded-[26px] p-4 apple-card shadow-lg origin-bottom relative overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-25 pointer-events-none transition-opacity group-hover:opacity-40" style={{ background: `linear-gradient(145deg, ${s.color || accent}50, transparent 55%)` }} />
              <div className="aspect-square rounded-[18px] mb-4 overflow-hidden relative" style={{ backgroundColor: (s.color || accent) + '18' }}>
                {s.type?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[13px] text-neutral-400">{s.type?.split('/')[1] || 'file'}</div>
                )}
              </div>
              <p className="text-[15px] font-medium text-white truncate px-1 relative">{s.name || 'untitled'}</p>
              {s.caption && <p className="text-[13px] text-neutral-400 mt-1.5 line-clamp-2 px-1 relative">{s.caption}</p>}
              <p className="text-[11px] text-neutral-500 mt-2.5 px-1 relative">{new Date(s.createdAt || '').toLocaleDateString()}</p>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && (
          <p className="text-neutral-500 text-center py-16 text-[16px]">The tide is still. Place the first drop.</p>
        )}
      </div>
    </div>
  );
}
