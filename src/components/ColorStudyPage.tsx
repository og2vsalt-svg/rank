import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function ColorStudyPage() {
  const { navigate } = useRouter();
  const [colors, setColors] = useState(['#0A84FF', '#FF3B30', '#34C759', '#FF9500']);
  const [title, setTitle] = useState('Quiet palette');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateColor = (i: number, val: string) => {
    setColors((c) => c.map((col, idx) => (idx === i ? val : col)));
  };

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const text = `${title}\n\n${colors.join('\n')}`;
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'palette.txt', { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: title,
        color: colors[0],
        cardTitle: title,
        meta: { desk: 'colorstudy', colors },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'Could not publish');
      }
    } catch (e: any) {
      setError(e.message || 'Failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Color Study</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">A quiet palette.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Compose four colors. Name the study. Publish it as a permanent share with Discord embed. Soft warnings only.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Study title"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition"
          />

          <div className="grid grid-cols-2 gap-4 mb-8">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="color"
                  value={c}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="w-12 h-12 rounded-2xl border border-white/20 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-neutral-400">{c}</span>
              </div>
            ))}
          </div>

          <div className="flex h-24 rounded-2xl overflow-hidden mb-8 border border-white/10">
            {colors.map((c, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Publishing…' : 'Publish palette'}
          </motion.button>

          {link && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 glass rounded-2xl border border-white/5"
            >
              <p className="text-xs text-neutral-500 mb-1">Share link</p>
              <button
                onClick={() => navigate('share', link.split('/').pop() || '')}
                className="text-sm text-[#0A84FF] break-all text-left"
              >
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
