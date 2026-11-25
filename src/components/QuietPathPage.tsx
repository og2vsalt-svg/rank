import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietPathPage() {
  const [steps, setSteps] = useState([{ title: '', note: '' }]);
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const update = (i: number, field: 'title' | 'note', val: string) => {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const addStep = () => setSteps(prev => [...prev, { title: '', note: '' }]);

  const share = async () => {
    const valid = steps.filter(s => s.title.trim() || s.note.trim());
    if (!valid.length) return setErr('add at least one step');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      const md = valid.map((s, i) => `## ${i + 1}. ${s.title || 'untitled'}\n\n${s.note || ''}`).join('\n\n---\n\n');
      const file = new File([md], 'quiet-path.md', { type: 'text/markdown' });
      const res = await publishLocalFile(file, {
        caption: 'a quiet path of notes',
        color: accent,
        cardTitle: valid[0].title || 'Quiet Path',
        meta: { desk: 'quietpath', steps: valid.length },
      });
      if (res.ok && res.embed) setLink(res.embed);
      else setErr(res.error || 'path slowed');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Path</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">A sequence of quiet notes.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Shape a short path of titles and notes. Publish the whole path as one clean markdown share. Permanent Discord-ready link. Soft warnings only. No file limits. Apple-style springs.
          </p>

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">accent for the path</span>
          </div>

          <div className="space-y-4 mb-5">
            {steps.map((s, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-[16px] p-4">
                <input value={s.title} onChange={(e) => update(i, 'title', e.target.value)} placeholder={`Step ${i + 1} title`} className="w-full bg-transparent text-[15px] text-white placeholder:text-neutral-500 mb-2 focus:outline-none" />
                <textarea value={s.note} onChange={(e) => update(i, 'note', e.target.value)} placeholder="note…" rows={2} className="w-full bg-transparent text-[14px] text-neutral-300 placeholder:text-neutral-600 resize-none focus:outline-none" />
              </div>
            ))}
          </div>

          <button onClick={addStep} className="text-[13px] text-neutral-400 hover:text-white mb-5 transition">+ add step</button>

          <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} onClick={share} disabled={busy} className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg" style={{ background: accent }}>
            {busy ? 'Weaving…' : 'Publish the path'}
          </motion.button>

          <AnimatePresence>
            {link && <motion.a initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} href={link} className="block mt-5 text-[13px] break-all" style={{ color: accent }}>{link}</motion.a>}
            {err && <motion.p className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
