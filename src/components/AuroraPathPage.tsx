import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Step = { title: string; note: string; file?: File };

export default function AuroraPathPage() {
  const { navigate } = useRouter();
  const [steps, setSteps] = useState<Step[]>([{ title: '', note: '' }]);
  const [color, setColor] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const addStep = () => setSteps((s) => [...s, { title: '', note: '' }]);
  const update = (i: number, patch: Partial<Step>) => setSteps((s) => s.map((st, idx) => idx === i ? { ...st, ...patch } : st));

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Publish a markdown summary as a share, and individual files if present
      const md = steps.map((st, i) => `## ${i + 1}. ${st.title || 'step'}\n${st.note}\n`).join('\n');
      const blob = new Blob([md], { type: 'text/markdown' });
      const file = new File([blob], 'aurora-path.md', { type: 'text/markdown' });
      const res = await publishLocalFile(file, {
        cardTitle: 'Aurora Path',
        caption: `${steps.length} steps along a quiet path`,
        color,
        meta: { desk: 'aurorapath', steps: steps.length },
      });
      if (res.ok && res.id) setLink(shareUrls(res.id).app);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#5AC8FA] mb-2">Aurora Path</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">A sequence of quiet steps.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Build a short path of titles and notes. Publish the whole path as a clean markdown share. Soft warnings only. Discord embeds on every link. Prior features stay intact.
          </p>

          <div className="space-y-5 mb-6">
            {steps.map((st, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                <input
                  value={st.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder={`Step ${i + 1} title`}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
                />
                <textarea
                  value={st.note}
                  onChange={(e) => update(i, { note: e.target.value })}
                  placeholder="Note"
                  rows={2}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 resize-none"
                />
              </motion.div>
            ))}
          </div>

          <button onClick={addStep} className="text-sm text-[#5AC8FA] mb-6 hover:underline">+ add step</button>

          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm text-neutral-400">Accent</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
          </div>

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#5AC8FA] text-black"
          >
            {busy ? 'Charting path…' : 'Publish aurora path'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-2xl p-4">
                <p className="text-xs text-neutral-500 mb-1">path link</p>
                <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#5AC8FA] text-sm break-all text-left">{link}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
