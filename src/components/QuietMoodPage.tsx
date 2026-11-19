import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const moods = [
  { name: 'Calm', color: '#64D2FF', emoji: '🌊' },
  { name: 'Bright', color: '#FFD60A', emoji: '☀️' },
  { name: 'Deep', color: '#BF5AF2', emoji: '🌌' },
  { name: 'Warm', color: '#FF9500', emoji: '🔥' },
  { name: 'Still', color: '#30D158', emoji: '🍃' },
];

export default function QuietMoodPage() {
  const [mood, setMood] = useState(moods[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const publish = async () => {
    if (!note.trim() || busy) return;
    setBusy(true);
    setWarn(null);
    try {
      const body = `${mood.emoji} ${mood.name}\n\n${note.trim()}`;
      const file = new File([body], `quiet-mood-${mood.name.toLowerCase()}.txt`, { type: 'text/plain' });
      if (file.size > 40 * 1024 * 1024) setWarn('Large reflection — may feel slow. No hard limits.');
      const res = await publishLocalFile(file, {
        caption: note.trim().slice(0, 140),
        color: mood.color,
        cardTitle: `${mood.name} Mood`,
        meta: { desk: 'quiet-mood', mood: mood.name },
      });
      if (res.ok && res.embed) setLink(res.embed);
      else setWarn(res.error || 'publish failed');
    } catch (e: any) {
      setWarn(e.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 relative overflow-hidden"
        >
          <motion.div
            className="absolute -inset-px rounded-[36px] pointer-events-none"
            style={{ background: `radial-gradient(circle at 30% 20%, ${mood.color}22, transparent 60%)` }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-[13px] font-medium tracking-wide mb-2 relative" style={{ color: mood.color }}>Quiet Mood</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 relative">Share how it feels.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 relative">
            Pick a mood. Write a quiet reflection. It settles into the database as a text file with a polished Discord embed on every link. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <div className="flex flex-wrap gap-2 mb-6 relative">
            {moods.map((m) => (
              <motion.button
                key={m.name}
                whileTap={{ scale: 0.96 }}
                onClick={() => setMood(m)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${mood.name === m.name ? 'text-black' : 'text-white/80 bg-white/10'}`}
                style={mood.name === m.name ? { background: m.color } : {}}
              >
                {m.emoji} {m.name}
              </motion.button>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's moving through you…"
            rows={5}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition resize-none relative"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-5 relative">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !note.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl relative"
            style={{ background: mood.color }}
          >
            {busy ? 'Settling…' : 'Publish mood'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center relative">
              <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{link}</a>
              <p className="text-xs text-neutral-500 mt-1">Discord-ready link</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
