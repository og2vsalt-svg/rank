import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Step = {
  id: string;
  note: string;
  file?: File;
  preview?: string;
  size?: number;
  publishedId?: string;
};

export default function CascadeJournalPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('quiet cascade');
  const [accent, setAccent] = useState('#0A84FF');
  const [steps, setSteps] = useState<Step[]>([{ id: '1', note: '' }]);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<{ id: string; url: string; warn?: string }[]>([]);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addStep = () => setSteps((s) => [...s, { id: Date.now().toString(36), note: '' }]);

  const updateNote = (id: string, note: string) =>
    setSteps((s) => s.map((st) => (st.id === id ? { ...st, note } : st)));

  const onFile = (id: string, file: File | null) => {
    if (!file) return;
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setSteps((s) => s.map((st) => (st.id === id ? { ...st, file, preview, size: file.size } : st)));
  };

  const publishAll = useCallback(async () => {
    setPublishing(true);
    const newResults: typeof results = [];
    for (const step of steps) {
      if (!step.note.trim() && !step.file) continue;
      let warn: string | undefined;
      if (step.file && step.file.size > 40 * 1024 * 1024) warn = 'large step. browser may feel slow. nothing is blocked.';
      try {
        if (step.file) {
          const pub = await publishLocalFile(step.file, {
            caption: step.note || title,
            cardTitle: title,
            color: accent,
          });
          if (pub.ok && pub.id) {
            newResults.push({ id: pub.id, url: shareUrls(pub.id).embed, warn: pub.warn || warn });
          }
        } else {
          const blob = new Blob([step.note], { type: 'text/plain' });
          const file = new File([blob], `${title}-note.txt`, { type: 'text/plain' });
          const pub = await publishLocalFile(file, {
            caption: step.note,
            cardTitle: title,
            color: accent,
          });
          if (pub.ok && pub.id) {
            newResults.push({ id: pub.id, url: shareUrls(pub.id).embed, warn: pub.warn || undefined });
          }
        }
      } catch {}
    }
    setResults(newResults);
    setPublishing(false);
  }, [steps, title, accent]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">cascade journal</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">sequence quiet moments.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Build a living cascade of notes and optional local files. Each step publishes as its own permanent Discord-ready link under a shared title and accent. Soft size warnings only — no hard limits, no boosting. Apple-style springs on frosted glass.</p>
        </motion.div>

        <div className="space-y-6 mb-10">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="shared title"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-lg focus:outline-none focus:border-[#0A84FF]/50"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-neutral-500">accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
          </div>
        </div>

        <div className="space-y-5">
          <AnimatePresence>
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="glass rounded-3xl p-6 space-y-4"
              >
                <textarea
                  value={step.note}
                  onChange={(e) => updateNote(step.id, e.target.value)}
                  placeholder={`step ${i + 1} note…`}
                  rows={3}
                  className="w-full bg-transparent border-0 resize-none focus:outline-none text-base placeholder:text-neutral-600"
                />
                {step.preview && <img src={step.preview} alt="" className="w-full max-h-48 object-cover rounded-2xl" />}
                {step.size && step.size > 20 * 1024 * 1024 && (
                  <p className="text-xs text-amber-400">large file — encoding or upload may feel slow. nothing is blocked.</p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileRefs.current[i]?.click()}
                    className="text-xs px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition"
                  >
                    {step.file ? 'change file' : 'attach file'}
                  </button>
                  <input
                    ref={(el) => (fileRefs.current[i] = el)}
                    type="file"
                    className="hidden"
                    onChange={(e) => onFile(step.id, e.target.files?.[0] || null)}
                  />
                  {step.file && <span className="text-xs text-neutral-500 truncate">{step.file.name}</span>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={addStep} className="px-5 py-2.5 rounded-full bg-white/10 text-sm hover:bg-white/15 transition">add step</button>
          <button
            onClick={publishAll}
            disabled={publishing}
            className="px-6 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
          >
            {publishing ? 'publishing…' : 'publish cascade'}
          </button>
        </div>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-4">
            <p className="text-sm text-neutral-400">each link ships with a polished Discord embed</p>
            {results.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono truncate max-w-xs">{r.url}</p>
                  {r.warn && <p className="text-xs text-amber-400 mt-1">{r.warn}</p>}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(r.url)}
                  className="text-xs px-4 py-2 rounded-full bg-[#0A84FF] text-white"
                >
                  copy
                </button>
              </div>
            ))}
          </motion.div>
        )}

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block">← back home</button>
      </div>
    </div>
  );
}
