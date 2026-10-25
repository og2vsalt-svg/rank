import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenNestPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(16);
    setShares(list);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
    setWarn(dropped.some(f => f.size > 40 * 1024 * 1024) ? 'Large files may feel slow to settle. No hard limit — only this gentle note.' : null);
  };

  const nest = async () => {
    if (!files.length) return setErr('drop local files to nest');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'nested in soft light',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softlumennest' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one file paused');
      }
      setLinks(newLinks);
      setFiles([]);
      setCaption('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'the nest quieted');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 16 }}
          className="glass rounded-[36px] p-10 mb-12 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Lumen Nest</p>
          <h1 className="text-[34px] font-semibold tracking-tight mb-3">A quiet nest for shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-7">
            Soft floating cards that gently breathe and settle around a still center. Drop local files; each lands in storage and the public_shares table. Share links carry polished Discord embeds. Spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-white/15 rounded-[28px] p-10 text-center mb-6 hover:border-white/25 transition cursor-pointer"
            onClick={() => document.getElementById('nest-input')?.click()}
          >
            <p className="text-neutral-300 text-[15px]">{files.length ? `${files.length} ready to nest` : 'Drop local files here'}</p>
            <input id="nest-input" type="file" multiple className="hidden" onChange={(e) => {
              const sel = Array.from(e.target.files || []);
              setFiles(prev => [...prev, ...sel]);
              setWarn(sel.some(f => f.size > 40 * 1024 * 1024) ? 'Large files may feel slow. No hard limit.' : null);
            }} />
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared note for the nest…"
            className="w-full bg-black/25 border border-white/10 rounded-[20px] px-5 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-5 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-11 h-11 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent light</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={nest}
            disabled={busy || !files.length}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Nesting…' : 'Settle into the nest'}
          </motion.button>

          <AnimatePresence>
            {links.map((l) => (
              <motion.a key={l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} href={l} className="block mt-4 text-[13px] break-all" style={{ color: accent }}>{l}</motion.a>
            ))}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 70, damping: 14, delay: i * 0.05 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="glass block rounded-[26px] p-6 shadow-lg"
              style={{ borderColor: s.color || accent }}
            >
              <p className="font-medium text-white text-[15px] mb-1">{s.name || 'untitled'}</p>
              {s.caption && <p className="text-neutral-400 text-[13px]">{s.caption}</p>}
              <p className="text-[11px] text-neutral-500 mt-3">{s.size ? Math.round(s.size / 1024) + ' kb' : ''}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
