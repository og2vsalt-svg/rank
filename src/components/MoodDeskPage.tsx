import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const MOODS = [
  { emoji: '☀️', label: 'sunny', color: '#FF9F0A' },
  { emoji: '🌧️', label: 'rainy', color: '#5E5CE6' },
  { emoji: '🌙', label: 'night', color: '#0A84FF' },
  { emoji: '🌿', label: 'calm', color: '#30D158' },
  { emoji: '🔥', label: 'focused', color: '#FF453A' },
  { emoji: '✨', label: 'inspired', color: '#BF5AF2' },
];

export default function MoodDeskPage() {
  const { navigate } = useRouter();
  const [mood, setMood] = useState(MOODS[0]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    setPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setWarn(f && f.size > 40_000_000 ? 'Large files may take a moment. No hard limits.' : null);
    setLink(null);
    setError(null);
  }, []);

  const publish = async () => {
    if (busy || (!text.trim() && !file)) return;
    setBusy(true);
    setError(null);
    try {
      const caption = text.trim() || `${mood.label} mood`;
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption,
          color: mood.color,
          cardTitle: `${mood.emoji} ${mood.label}`,
          meta: { desk: 'mood', mood: mood.label, text: text.trim() },
        });
      } else {
        const blob = new Blob([text || caption], { type: 'text/plain' });
        const txtFile = new File([blob], `${mood.label}-mood.txt`, { type: 'text/plain' });
        res = await publishLocalFile(txtFile, {
          caption,
          color: mood.color,
          cardTitle: `${mood.emoji} ${mood.label}`,
          meta: { desk: 'mood', mood: mood.label, text: text.trim() },
        });
      }
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'could not share');
      }
    } catch (e: any) {
      setError(e.message || 'failed');
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
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Mood</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">How's the day feeling?</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Pick a mood, leave a quiet note, optionally attach a file. Permanent share with polished Discord embeds. Soft size warnings only.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {MOODS.map((m) => (
              <motion.button
                key={m.label}
                whileTap={{ scale: 0.96 }}
                onClick={() => setMood(m)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition ${mood.label === m.label ? 'text-white shadow-lg' : 'text-neutral-300 bg-white/5'}`}
                style={mood.label === m.label ? { backgroundColor: m.color } : {}}
              >
                {m.emoji} {m.label}
              </motion.button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A quiet thought for this mood…"
            rows={4}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#0A84FF]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40');
              if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-10 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            {preview ? (
              <img src={preview} alt="" className="mx-auto max-h-40 rounded-2xl object-cover" />
            ) : file ? (
              <p className="text-neutral-300 text-[15px]">{file.name}</p>
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">Optional file</p>
                <p className="text-neutral-500 text-sm mt-1">drop or click</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || (!text.trim() && !file)}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ backgroundColor: mood.color }}
          >
            {busy ? 'Sharing…' : `Share ${mood.label} mood`}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass rounded-2xl p-4 text-center"
              >
                <p className="text-sm text-neutral-400 mb-2">Your mood</p>
                <button
                  onClick={() => navigate('share', link.split('/').pop() || '')}
                  className="text-[#0A84FF] text-sm break-all"
                >
                  {link}
                </button>
              </motion.div>
            )}
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-400">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
