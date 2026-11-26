import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietConstellationPage() {
  const [stars, setStars] = useState([{ title: '', note: '', file: null as File | null }]);
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState<string | null>(null);

  const update = (i: number, field: 'title' | 'note', val: string) => {
    setStars(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const setFile = (i: number, f: File | null) => {
    setStars(prev => prev.map((s, idx) => idx === i ? { ...s, file: f } : s));
    if (f && f.size > 40 * 1024 * 1024) setWarn('Large file. May feel slow. No hard limit.');
  };

  const addStar = () => setStars(prev => [...prev, { title: '', note: '', file: null }]);

  const share = async () => {
    const valid = stars.filter(s => s.title.trim() || s.note.trim() || s.file);
    if (!valid.length) return setErr('add at least one star');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      let md = `# Quiet Constellation\n\nA quiet map of ideas.\n\n`;
      const filesToUpload: File[] = [];
      valid.forEach((s, i) => {
        md += `## ${i + 1}. ${s.title || 'untitled star'}\n\n${s.note || ''}\n\n`;
        if (s.file) {
          md += `*Attached: ${s.file.name}*\n\n`;
          filesToUpload.push(s.file);
        }
        md += '---\n\n';
      });
      const file = new File([md], 'quiet-constellation.md', { type: 'text/markdown' });
      if (file.size > 40 * 1024 * 1024) setWarn('Large constellation. May feel slow. No hard limit.');
      const res = await publishLocalFile(file, {
        caption: 'a quiet constellation of ideas',
        color: accent,
        cardTitle: valid[0].title || 'Quiet Constellation',
        meta: { desk: 'quietconstellation', stars: valid.length },
      });
      if (res.ok && res.embed) {
        setLink(res.embed);
        // Optionally upload attached files separately if desired, but main share is the map
      } else setErr(res.error || 'constellation slowed');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Constellation</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Map quiet stars of ideas.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Place titles, notes, and optional local files as stars. Publish the whole constellation as one clean markdown share. Permanent Discord-ready link. Soft size warnings only. No hard limits. Different from pure file vaults. Prior features intact. No traces of boosting.
          </p>

          <div className="space-y-4 mb-5">
            {stars.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-black/10 rounded-[16px] p-4">
                <input value={s.title} onChange={(ev) => update(i, 'title', ev.target.value)} placeholder={`Star ${i + 1} title`} className="w-full bg-transparent border-b border-white/10 pb-2 mb-2 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none" />
                <textarea value={s.note} onChange={(ev) => update(i, 'note', ev.target.value)} placeholder="Note…" rows={2} className="w-full bg-transparent text-[14px] text-white placeholder:text-neutral-500 resize-none focus:outline-none" />
                <input type="file" onChange={(ev) => setFile(i, ev.target.files?.[0] || null)} className="mt-2 text-[12px] text-neutral-400" />
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <button type="button" onClick={addStar} className="text-[13px] text-neutral-300 hover:text-white">Add star</button>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} onClick={share} disabled={busy} className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg" style={{ background: accent }}>
            {busy ? 'Mapping…' : 'Share the constellation'}
          </motion.button>

          {err && <p className="text-[13px] text-red-400 mt-3">{err}</p>}

          <AnimatePresence>
            {link && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                <a href={link} target="_blank" rel="noreferrer" className="text-[13px] text-blue-300 hover:underline break-all">{link}</a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
