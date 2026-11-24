import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const MOODS = [
  { name: 'calm', color: '#0A84FF', emoji: '🌊' },
  { name: 'warm', color: '#FF9F0A', emoji: '🔥' },
  { name: 'soft', color: '#AF52DE', emoji: '🌸' },
  { name: 'clear', color: '#30D158', emoji: '🍃' },
  { name: 'deep', color: '#5E5CE6', emoji: '🌙' },
  { name: 'bright', color: '#FFD60A', emoji: '☀️' },
];

export default function MoodBoardPage() {
  const { navigate } = useRouter();
  const [selected, setSelected] = useState(MOODS[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas failed');
      ctx.fillStyle = '#0b0b0d';
      ctx.fillRect(0, 0, 800, 500);
      const grd = ctx.createRadialGradient(400, 250, 0, 400, 250, 360);
      grd.addColorStop(0, selected.color + '40');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 800, 500);
      ctx.font = '72px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(selected.emoji, 400, 200);
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px system-ui';
      ctx.fillText(selected.name, 400, 280);
      if (note) {
        ctx.font = '18px system-ui';
        ctx.fillStyle = '#a0a0a5';
        const words = note.split(' ');
        let line = '';
        let y = 340;
        for (const w of words) {
          const test = line + w + ' ';
          if (ctx.measureText(test).width > 500) {
            ctx.fillText(line, 400, y);
            line = w + ' ';
            y += 28;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, 400, y);
      }
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('could not capture');
      const file = new File([blob], `${selected.name}-mood.png`, { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: note || `${selected.name} mood`,
        color: selected.color,
        cardTitle: `${selected.name} mood`,
        meta: { desk: 'moodboard', kind: 'mood-card', mood: selected.name },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'could not share');
      }
    } catch (e: any) {
      setError(e.message || 'failed');
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
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#AF52DE] mb-2">Mood Board</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Catch a feeling.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Pick a mood, add a quiet note, and publish a luminous card as a permanent share. Discord embeds included. Soft warnings only.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {MOODS.map((m) => (
              <motion.button
                key={m.name}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelected(m)}
                className={`rounded-2xl py-4 text-center border transition ${selected.name === m.name ? 'border-white/30 bg-white/10' : 'border-white/10 bg-white/5'}`}
              >
                <div className="text-3xl mb-1">{m.emoji}</div>
                <div className="text-xs capitalize" style={{ color: m.color }}>{m.name}</div>
              </motion.button>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a quiet note about this feeling…"
            rows={3}
            className="w-full mb-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-[#AF52DE]/40 resize-none"
          />

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: selected.color }}
          >
            {busy ? 'Sharing…' : 'Share this mood'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
              <p className="text-sm text-neutral-400 mb-2">live share</p>
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#0A84FF] text-sm underline">
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
