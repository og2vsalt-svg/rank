import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function LumenDiaryPage() {
  const { navigate } = useRouter();
  const [entry, setEntry] = useState('');
  const [mood, setMood] = useState('calm');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const moods = ['calm', 'bright', 'quiet', 'warm', 'clear', 'soft'];

  const publish = useCallback(async () => {
    if (!entry.trim() && !file) {
      setError('write an entry or attach a moment');
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const title = `${date} · ${mood}`;
      let target: File;
      if (file) {
        target = file;
      } else {
        const text = `# ${title}\n\n${entry}`.trim();
        target = new File([text], `${date.replace(/\s+/g, '-')}-diary.md`, { type: 'text/markdown' });
      }

      const pub = await publishLocalFile(target, {
        caption: entry || `${mood} lumen diary entry`,
        cardTitle: title,
        color: '#0A84FF',
        meta: { mood, diary: true },
      });

      if (pub.ok && pub.id) {
        setResult({
          url: shareUrls(pub.id).embed,
          warn: pub.warn || undefined,
        });
      } else {
        setError(pub.error || 'could not seal the entry');
      }
    } catch (e: any) {
      setError(e?.message || 'something went quiet');
    }
    setUploading(false);
  }, [entry, mood, file]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen diary</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">a quiet page for today.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Write a short entry, choose a mood, optionally attach a local photo or note. It becomes a permanent Discord-ready link. Soft size warnings only. Apple-style springs on frosted glass.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-3xl p-8 space-y-6"
        >
          <div className="flex flex-wrap gap-2 justify-center">
            {moods.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`px-4 py-1.5 rounded-full text-sm transition ${
                  mood === m ? 'bg-[#0A84FF] text-white' : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="a few words about the day..."
            rows={6}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-base leading-relaxed focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />

          <div className="flex items-center justify-center gap-4">
            <label className="text-sm text-neutral-400 cursor-pointer hover:text-white transition">
              {file ? file.name : 'attach a moment'}
              <input
                type="file"
                accept="image/*,.md,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <button onClick={() => setFile(null)} className="text-xs text-neutral-500 hover:text-white">clear</button>
            )}
          </div>

          {file && file.size > 40 * 1024 * 1024 && (
            <p className="text-xs text-amber-400 text-center">large drop. the browser may feel slow while it sends. nothing is blocked.</p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={uploading}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
          >
            {uploading ? 'sealing…' : "seal today's entry"}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm text-red-400 mt-6">{error}</motion.p>
          )}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-8 mt-8 text-center space-y-4"
            >
              <p className="text-sm text-neutral-400">discord-ready diary link</p>
              {result.warn && <p className="text-xs text-amber-400">{result.warn}</p>}
              <button
                onClick={() => navigator.clipboard.writeText(result.url)}
                className="px-6 py-2.5 rounded-full bg-white/10 text-sm hover:bg-white/15 transition"
              >
                copy share link
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
