import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Dropped = {
  file: File;
  caption: string;
  preview?: string;
};

export default function QuietHarborPage() {
  const [drops, setDrops] = useState<Dropped[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [links, setLinks] = useState<{ name: string; embed: string }[]>([]);
  const [err, setErr] = useState('');

  const onFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const next: Dropped[] = [];
    let large = false;
    for (const file of Array.from(list)) {
      if (file.size > 40 * 1024 * 1024) large = true;
      const item: Dropped = { file, caption: '' };
      if (file.type.startsWith('image/')) {
        item.preview = URL.createObjectURL(file);
      }
      next.push(item);
    }
    setDrops((prev) => [...prev, ...next]);
    setWarn(large ? 'One or more files are large. Uploads may feel slow. No hard limit.' : null);
  }, []);

  const updateCaption = (i: number, v: string) => {
    setDrops((prev) => prev.map((d, idx) => (idx === i ? { ...d, caption: v } : d)));
  };

  const remove = (i: number) => {
    setDrops((prev) => {
      const next = [...prev];
      const gone = next.splice(i, 1)[0];
      if (gone.preview) URL.revokeObjectURL(gone.preview);
      return next;
    });
  };

  const publish = async () => {
    if (drops.length === 0) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: { name: string; embed: string }[] = [];
    try {
      for (const d of drops) {
        const caption = d.caption.trim() || sharedCaption.trim() || 'from the quiet harbor';
        const res = await publishLocalFile(d.file, {
          caption,
          color: accent,
          cardTitle: d.file.name,
          meta: { desk: 'quietharbor' },
        });
        if (res.ok && res.embed) {
          made.push({ name: d.file.name, embed: res.embed });
        } else {
          setErr(res.error || `failed on ${d.file.name}`);
          break;
        }
      }
      setLinks(made);
      if (made.length === drops.length) {
        drops.forEach((d) => d.preview && URL.revokeObjectURL(d.preview));
        setDrops([]);
        setSharedCaption('');
      }
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Harbor</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3 leading-tight">A still harbor for local files.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop files. They settle with gentle spring motion on frosted glass. Each can carry its own note, or share one caption. Publish straight to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Prior desks stay fully intact.
          </p>

          <label className="block rounded-[24px] border border-dashed border-white/15 bg-black/20 p-10 text-center cursor-pointer hover:border-white/25 transition mb-6">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <p className="text-[15px] text-neutral-300">Drop local files or click to choose</p>
            <p className="text-[12px] text-neutral-500 mt-1">Images show live previews. Large files warned, never refused.</p>
          </label>

          <AnimatePresence>
            {drops.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mb-6"
              >
                {drops.map((d, i) => (
                  <motion.div
                    key={d.file.name + i}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                    className="glass rounded-[20px] p-4 flex gap-4 items-start"
                  >
                    {d.preview ? (
                      <img src={d.preview} alt="" className="w-16 h-16 rounded-[12px] object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-[12px] bg-white/5 grid place-items-center text-[11px] text-neutral-400">file</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] truncate">{d.file.name}</p>
                      <p className="text-[11px] text-neutral-500">{(d.file.size / 1024 / 1024).toFixed(1)} MB</p>
                      <input
                        value={d.caption}
                        onChange={(e) => updateCaption(i, e.target.value)}
                        placeholder="optional note for this file"
                        className="mt-2 w-full bg-transparent border-b border-white/10 text-[13px] py-1 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white text-sm">×</button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <input
            value={sharedCaption}
            onChange={(e) => setSharedCaption(e.target.value)}
            placeholder="shared caption (used when a file has none)"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[14px] mb-5 focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">accent for embeds</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || drops.length === 0}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the harbor…' : `Publish ${drops.length || ''} file${drops.length === 1 ? '' : 's'}`}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-2"
              >
                <p className="text-[13px] text-neutral-400">Share links (Discord embeds ready):</p>
                {links.map((l) => (
                  <a key={l.embed} href={l.embed} className="block text-[13px] break-all" style={{ color: accent }}>
                    {l.name} — {l.embed}
                  </a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
