import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Step = {
  file: File;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function SoftpathPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large path — may feel slower. No hard limits.' : null);
    const next: Step[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setSteps((p) => [...p, ...next]);
  }, []);

  const publish = async () => {
    if (!steps.length || busy) return;
    setBusy(true);
    for (const step of steps) {
      if (step.status === 'done') continue;
      setSteps((p) => p.map((s) => s.id === step.id ? { ...s, status: 'uploading' } : s));
      try {
        const res = await publishLocalFile(step.file, {
          caption: note.trim() || step.file.name,
          color: accent,
          cardTitle: step.file.name,
          meta: { desk: 'softpath' },
        });
        setSteps((p) => p.map((s) =>
          s.id === step.id
            ? { ...s, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
            : s
        ));
      } catch (e: any) {
        setSteps((p) => p.map((s) => s.id === step.id ? { ...s, status: 'error', error: e.message } : s));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="glass rounded-[32px] p-7 md:p-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Softpath</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">A soft path.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-7">
            Files settle one after another along a quiet path. One shared note. Every link gets a polished Discord embed. Soft warnings only. Human-crafted springs.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-10 text-center mb-6 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files along the path</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shared note for the path"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}

          <div className="space-y-3 mb-6">
            <AnimatePresence>
              {steps.map((step, i) => (
                <motion.div
                  key={step.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 200, damping: 22 }}
                  className="glass rounded-2xl p-3.5 flex items-center gap-3"
                >
                  {step.preview ? (
                    <img src={step.preview} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/5 grid place-items-center text-[10px] text-neutral-500">file</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{step.file.name}</p>
                    <p className="text-xs text-neutral-500">{(step.file.size / 1024 / 1024).toFixed(1)} MB · {step.status}</p>
                    {step.link && <a href={step.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block">{step.link}</a>}
                    {step.error && <p className="text-xs text-red-400">{step.error}</p>}
                  </div>
                  <button onClick={() => setSteps((p) => p.filter((s) => s.id !== step.id))} className="text-xs text-neutral-500 hover:text-white">remove</button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy || !steps.length}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : steps.length ? `Publish path (${steps.length})` : 'Drop files first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
