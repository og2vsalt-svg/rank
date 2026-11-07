import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftWhisperDeskPage() {
  const [whisper, setWhisper] = useState('');
  const [accent, setAccent] = useState('#BF5AF2');
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<{ embed: string; warn?: string | null } | null>(null);
  const [whispers, setWhispers] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(20).then((list) =>
      setWhispers(list.filter((s) => s.type === 'text/plain' || (s.caption && s.size < 12000)).slice(0, 16))
    );
  }, []);

  const leave = async () => {
    if (!whisper.trim()) return;
    setPosting(true);
    setResult(null);
    const blob = new Blob([whisper.trim()], { type: 'text/plain' });
    const file = new File([blob], 'whisper.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, {
      caption: whisper.trim(),
      color: accent,
      cardTitle: 'soft whisper',
    });
    setPosting(false);
    if (res.ok && res.embed) {
      setResult({ embed: res.embed, warn: res.warn });
      setWhisper('');
      listPublicShares(20).then((list) =>
        setWhispers(list.filter((s) => s.type === 'text/plain' || (s.caption && s.size < 12000)).slice(0, 16))
      );
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="glass rounded-[36px] p-8 sm:p-10"
        >
          <p className="text-sm text-[#BF5AF2] mb-3 tracking-wide font-medium">soft whisper desk</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white">
            leave a soft whisper.
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            A different kind of desk — pure text notes that settle into the shared database. No file required. Every link unfurls a polished Discord card. All prior desks remain fully intact. No traces of boosting.
          </p>

          <textarea
            value={whisper}
            onChange={(e) => setWhisper(e.target.value)}
            placeholder="whisper something quiet…"
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-3xl px-5 py-4 text-sm text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/25 resize-none"
          />

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs text-neutral-500">accent</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/20 cursor-pointer bg-transparent"
            />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!whisper.trim() || posting}
            onClick={leave}
            className="w-full py-3.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#c97af5] transition"
          >
            {posting ? 'whispering…' : 'leave whisper'}
          </motion.button>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass rounded-2xl p-5 text-center"
              >
                <p className="text-sm text-neutral-300 mb-2">whispered</p>
                <a href={result.embed} target="_blank" rel="noreferrer" className="text-[#BF5AF2] text-sm break-all hover:underline">
                  {result.embed}
                </a>
                {result.warn && <p className="text-xs text-amber-300/70 mt-2">{result.warn}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {whispers.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-12">
            <h2 className="text-lg font-medium mb-4 text-neutral-300">recent soft whispers</h2>
            <div className="space-y-3">
              {whispers.map((w, i) => (
                <motion.a
                  key={w.id}
                  href={shareUrls(w.id).app}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 140, damping: 16 }}
                  className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition-all duration-500"
                  style={{ borderColor: w.color ? `${w.color}33` : undefined }}
                >
                  <p className="text-sm text-white line-clamp-2">{w.caption || 'soft whisper'}</p>
                  <p className="text-xs text-neutral-500 mt-1">{w.author || 'anonymous'}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
