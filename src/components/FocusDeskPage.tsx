import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function FocusDeskPage() {
  const { navigate } = useRouter();
  const [note, setNote] = useState('');
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, secondsLeft]);

  const start = () => {
    if (secondsLeft === 0) setSecondsLeft(minutes * 60);
    setRunning(true);
  };

  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(0);
  };

  const publish = async () => {
    if (!note.trim() || busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const body = `# Focus note\n\n${note.trim()}\n\n_session: ${minutes} minutes_`;
      const file = new File([body], 'focus-note.md', { type: 'text/markdown' });
      const res = await publishLocalFile(file, {
        caption: note.trim().slice(0, 120),
        color: '#0A84FF',
        cardTitle: 'Focus note',
        meta: { desk: 'focus', kind: 'focus-note', minutes },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'could not share the note');
      }
    } catch (e: any) {
      setError(e.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  const display = secondsLeft > 0
    ? `${Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:00`;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5 text-center"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Focus Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-2 text-white">A quiet interval.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-10">
            Set a soft timer. Write while it runs. When you're ready, share the note as a permanent file with a polished Discord embed. Soft size warnings only. No hard limits.
          </p>

          <div className="text-7xl font-light tabular-nums tracking-tighter text-white mb-8">
            {display}
          </div>

          <div className="flex justify-center gap-3 mb-8">
            {!running ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={start}
                className="px-6 py-3 rounded-2xl bg-[#0A84FF] text-white text-sm font-medium"
              >
                {secondsLeft === 0 ? 'start' : 'resume'}
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={pause}
                className="px-6 py-3 rounded-2xl bg-white/10 text-white text-sm font-medium"
              >
                pause
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="px-6 py-3 rounded-2xl bg-white/5 text-neutral-300 text-sm"
            >
              reset
            </motion.button>
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {[15, 25, 45].map((m) => (
              <button
                key={m}
                onClick={() => { setMinutes(m); reset(); }}
                className={`px-4 py-1.5 rounded-full text-xs ${
                  minutes === m ? 'bg-white/15 text-white' : 'text-neutral-500 hover:text-white'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What are you focusing on…"
            rows={6}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none leading-relaxed"
          />

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !note.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing note…' : 'Share focus note'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
              <p className="text-sm text-neutral-400 mb-2">your note is live</p>
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
