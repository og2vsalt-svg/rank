import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function WhisperNotePage() {
  const { navigate } = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState(24);

  const publish = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'whisper.txt', { type: 'text/plain' });
      const expiresAt = hours > 0 ? new Date(Date.now() + hours * 3600000).toISOString() : null;
      const res = await publishLocalFile(file, {
        caption: text.slice(0, 120),
        cardTitle: 'whisper note',
        expiresAt,
        meta: { desk: 'whisper', kind: 'whisper-note', hours },
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
      <div className="pt-28 pb-24 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-10 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#30D158] mb-2">Whisper Note</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Leave a quiet word.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Type a short note. It becomes a shareable file that can fade after a chosen time. Soft warnings only. Discord embeds on the link.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="something that doesn't need to stay forever…"
            rows={6}
            className="w-full mb-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-[#30D158]/40 resize-none"
          />

          <div className="mb-5 flex items-center gap-3 text-sm text-neutral-400">
            <span>fade after</span>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={24}>1 day</option>
              <option value={168}>1 week</option>
              <option value={0}>never</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !text.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#30D158]"
          >
            {busy ? 'Sharing…' : 'Share whisper'}
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
