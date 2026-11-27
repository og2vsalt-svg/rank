import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Step = {
  id: string;
  note: string;
  file?: File;
  published?: { id: string; url: string; warn?: string };
};

export default function QuietCascadePage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('quiet cascade');
  const [accent, setAccent] = useState('#BF5AF2');
  const [steps, setSteps] = useState<Step[]>([{ id: '1', note: '' }]);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);

  const addStep = () => setSteps((s) => [...s, { id: Date.now().toString(), note: '' }]);

  const updateStep = (id: string, patch: Partial<Step>) => {
    setSteps((s) => s.map((st) => (st.id === id ? { ...st, ...patch } : st)));
  };

  const publishAll = useCallback(async () => {
    setPublishing(true);
    const next = [...steps];
    for (let i = 0; i < next.length; i++) {
      const st = next[i];
      if (!st.note.trim() && !st.file) continue;
      try {
        if (st.file) {
          const pub = await publishLocalFile(st.file, {
            caption: st.note || `Step ${i + 1} of ${title}`,
            cardTitle: `${title} — ${i + 1}`,
            color: accent,
          });
          if (pub.ok && pub.id) {
            next[i].published = { id: pub.id, url: shareUrls(pub.id).embed, warn: pub.warn || undefined };
          }
        } else {
          // text-only note as a small text file
          const blob = new Blob([st.note], { type: 'text/plain' });
          const file = new File([blob], `step-${i + 1}.txt`, { type: 'text/plain' });
          const pub = await publishLocalFile(file, {
            caption: st.note,
            cardTitle: `${title} — ${i + 1}`,
            color: accent,
          });
          if (pub.ok && pub.id) {
            next[i].published = { id: pub.id, url: shareUrls(pub.id).embed, warn: pub.warn || undefined };
          }
        }
      } catch {}
    }
    setSteps(next);
    setPublishing(false);
    setDone(true);
  }, [steps, title, accent]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="text-center mb-10"
        >
          <p className="text-[#BF5AF2] text-sm tracking-wide mb-3">quiet cascade</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 leading-[1.05]">sequence quiet moments.</h1>
          <p className="text-neutral-400 text-base max-w-xl mx-auto">Write notes. Optionally attach a local file to each. Publish the cascade — each step becomes its own permanent Discord-ready link. Soft warnings only.</p>
        </motion.div>

        <div className="flex gap-3 mb-8 max-w-md mx-auto">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm" placeholder="cascade title" />
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer" />
        </div>

        <div className="space-y-4 mb-8">
          <AnimatePresence>
            {steps.map((st, i) => (
              <motion.div
                key={st.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-neutral-500">step {i + 1}</span>
                  {st.published && <span className="text-xs text-[#30D158]">published</span>}
                </div>
                <textarea
                  value={st.note}
                  onChange={(e) => updateStep(st.id, { note: e.target.value })}
                  placeholder="a quiet note…"
                  className="w-full bg-transparent text-sm resize-none outline-none mb-3 min-h-[60px]"
                />
                <label className="text-xs text-neutral-500 cursor-pointer">
                  {st.file ? st.file.name : 'attach a local file (optional)'}
                  <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && updateStep(st.id, { file: e.target.files[0] })} />
                </label>
                {st.published && (
                  <button
                    onClick={() => navigator.clipboard.writeText(st.published!.url)}
                    className="mt-3 text-xs px-3 py-1.5 rounded-full text-white"
                    style={{ background: accent }}
                  >
                    copy link
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button onClick={addStep} className="text-sm text-neutral-400 hover:text-white transition">+ add another step</button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publishAll}
            disabled={publishing || done}
            className="px-8 py-3 rounded-full text-sm font-medium text-white disabled:opacity-50"
            style={{ background: accent }}
          >
            {publishing ? 'publishing cascade…' : done ? 'cascade published' : 'publish cascade'}
          </motion.button>
          <button onClick={() => navigate('home')} className="text-sm text-neutral-500 hover:text-white">← back home</button>
        </div>
      </div>
    </div>
  );
}
