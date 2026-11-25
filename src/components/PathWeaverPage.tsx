import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

interface Step {
  id: string;
  title: string;
  note: string;
  file: File | null;
}

export default function PathWeaverPage() {
  const { navigate } = useRouter();
  const [steps, setSteps] = useState<Step[]>([{ id: '1', title: '', note: '', file: null }]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);

  const update = (id: string, patch: Partial<Step>) => setSteps(s => s.map(x => x.id === id ? { ...x, ...patch } : x));
  const add = () => setSteps(s => [...s, { id: Date.now().toString(), title: '', note: '', file: null }]);

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const lines = ['# Path', '', 'A woven sequence of notes and files.', ''];
      for (const step of steps) {
        if (!step.title.trim() && !step.note.trim() && !step.file) continue;
        lines.push(`## ${step.title.trim() || 'Untitled step'}`);
        if (step.note.trim()) lines.push(step.note.trim(), '');
        if (step.file) {
          const res = await publishLocalFile(step.file, {
            caption: step.note.trim() || step.title.trim() || undefined,
            cardTitle: step.file.name,
            meta: { desk: 'pathweaver' },
          });
          if (res.ok && res.id) {
            lines.push(`File: ${shareUrls(res.id).app}`, '');
          }
        }
      }
      if (lines.length < 4) {
        setResult({ error: 'Add at least one step with content.' });
        setBusy(false);
        return;
      }
      const md = lines.join('\n');
      const blob = new Blob([md], { type: 'text/markdown' });
      const file = new File([blob], 'path.md', { type: 'text/markdown' });
      const res = await publishLocalFile(file, {
        caption: 'Woven path of notes and files',
        cardTitle: 'Path',
        meta: { desk: 'pathweaver' },
      });
      if (res.ok && res.id) {
        setResult({ link: shareUrls(res.id).app });
      } else {
        setResult({ error: res.error || 'Could not weave the path.' });
      }
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#64D2FF] mb-2">Path Weaver</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Weave a path.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Build a short sequence of titled notes. Attach a local file to any step if you like. Publish the whole path as one clean markdown share with polished Discord embeds. Soft size warnings only.
          </p>

          <div className="space-y-5 mb-6">
            {steps.map((step, i) => (
              <div key={step.id} className="glass rounded-2xl p-5 space-y-3">
                <div className="text-xs text-neutral-500">Step {i + 1}</div>
                <input
                  value={step.title}
                  onChange={e => update(step.id, { title: e.target.value })}
                  placeholder="Title"
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                />
                <textarea
                  value={step.note}
                  onChange={e => update(step.id, { note: e.target.value })}
                  placeholder="Quiet note"
                  rows={2}
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none resize-none"
                />
                <label className="text-xs text-[#64D2FF] cursor-pointer hover:underline">
                  {step.file ? step.file.name : 'attach local file (optional)'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && update(step.id, { file: e.target.files[0] })}
                  />
                </label>
              </div>
            ))}
          </div>

          <button onClick={add} className="text-sm text-neutral-400 hover:text-white mb-6">+ add step</button>

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#64D2FF]"
          >
            {busy ? 'Weaving…' : 'Publish path'}
          </motion.button>

          {result?.link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 glass rounded-2xl p-4">
              <p className="text-sm text-neutral-400 mb-1">Ready</p>
              <button onClick={() => navigate('share', result.link!.split('/').pop() || '')} className="text-[#64D2FF] text-sm break-all text-left">{result.link}</button>
            </motion.div>
          )}
          {result?.error && <p className="text-sm text-red-400 mt-4">{result.error}</p>}
        </motion.div>
      </div>
    </div>
  );
}
