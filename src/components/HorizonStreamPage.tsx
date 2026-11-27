import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';
import Navbar from './Navbar';

export default function HorizonStreamPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('Horizon Stream');
  const [accent, setAccent] = useState('#30D158');
  const [steps, setSteps] = useState<{ id: string; name: string; url: string; warn?: string; note: string }[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addStep = async (file: File | null) => {
    if (!file && !currentNote.trim()) return;
    setPublishing(true);
    try {
      const toPublish = file || new File([new Blob([currentNote], { type: 'text/plain' })], 'note.txt', { type: 'text/plain' });
      const pub = await publishLocalFile(toPublish, {
        caption: currentNote || title,
        cardTitle: title,
        color: accent,
        meta: { desk: 'horizonstream', step: steps.length + 1, note: currentNote },
      });
      if (pub.ok && pub.id) {
        setSteps((prev) => [...prev, {
          id: pub.id!,
          name: file?.name || 'note',
          url: shareUrls(pub.id!).embed,
          warn: pub.warn || undefined,
          note: currentNote,
        }]);
        setCurrentNote('');
      }
    } catch {}
    setPublishing(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 92, damping: 18 }}
          className="text-center mb-10"
        >
          <p className="text-[#30D158] text-sm tracking-wide mb-3">horizon stream</p>
          <h1 className="text-5xl font-semibold tracking-tight mb-4 leading-[1.02]">sequence quiet moments.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Build a living stream step by step. Add notes or local files; each becomes its own permanent Discord-ready link under a shared title and accent. Soft size warnings only. Apple-style springs.
          </p>
        </motion.div>

        <div className="flex gap-3 mb-8">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 glass rounded-2xl px-4 py-3 text-sm outline-none" />
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-14 h-12 rounded-2xl glass" />
        </div>

        <div className="glass rounded-3xl p-6 mb-8 space-y-4">
          <textarea value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder="optional note for this step…" rows={3} className="w-full bg-white/[0.03] rounded-2xl p-3 text-sm outline-none resize-none" />
          <div className="flex gap-3">
            <button onClick={() => fileRef.current?.click()} className="px-5 py-2.5 rounded-full bg-white/10 text-sm">attach file</button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => addStep(null)} disabled={publishing} className="px-6 py-2.5 rounded-full text-sm font-medium text-black" style={{ background: accent }}>
              {publishing ? 'adding…' : 'add step'}
            </motion.button>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) addStep(e.target.files[0]); e.target.value = ''; }} />
          </div>
        </div>

        <AnimatePresence>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                className="glass rounded-2xl p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium">{i + 1}. {s.name}</p>
                  {s.note && <p className="text-xs text-neutral-400 mt-1">{s.note}</p>}
                  {s.warn && <p className="text-xs text-amber-400">{s.warn}</p>}
                </div>
                <button onClick={() => navigator.clipboard.writeText(s.url)} className="px-4 py-2 rounded-full text-xs font-medium text-white" style={{ background: accent }}>
                  copy link
                </button>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="block mx-auto mt-12 text-sm text-neutral-500 hover:text-white">← back home</button>
      </div>
    </div>
  );
}
