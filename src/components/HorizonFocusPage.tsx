import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, publishShare, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function HorizonFocusPage() {
  const { navigate } = useRouter();
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [title, setTitle] = useState('focus');
  const [reflection, setReflection] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const total = minutes * 60;
  const progress = total > 0 ? 1 - secondsLeft / total : 0;

  useEffect(() => {
    setSecondsLeft(minutes * 60);
  }, [minutes]);

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

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    if (thumb) URL.revokeObjectURL(thumb);
    if (f && f.type.startsWith('image/')) {
      setThumb(URL.createObjectURL(f));
    } else {
      setThumb(null);
    }
  }, [thumb]);

  const publish = async () => {
    if (!reflection.trim() && !file) {
      setError('write a quiet reflection or drop a file');
      return;
    }
    setPublishing(true);
    setError(null);
    setResult(null);
    try {
      const note = `# ${title || 'Focus'}\n\n${format(minutes * 60 - secondsLeft)} elapsed\n\n${reflection}`;
      if (file) {
        const pub = await publishLocalFile(file, {
          caption: reflection.trim().slice(0, 180) || 'A quiet focus',
          cardTitle: title.trim() || 'horizon focus',
          color: accent,
          meta: { focus: true, reflection: reflection.trim(), elapsed: minutes * 60 - secondsLeft },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          setResult({ url: urls.embed, warn: pub.warn || undefined });
        } else {
          setError(pub.error || 'could not publish');
        }
      } else {
        const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(note);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const pub = await publishShare({
          id,
          name: (title.trim() || 'focus') + '.md',
          type: 'text/markdown',
          size: note.length,
          dataUrl,
          caption: reflection.slice(0, 180) || 'quiet focus',
          color: accent,
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          setResult({ url: urls.embed, warn: pub.warn || undefined });
        } else {
          setError(pub.error || 'could not publish');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'something quiet went wrong');
    } finally {
      setPublishing(false);
    }
  };

  const prettySize = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">horizon focus</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">a quiet hour.<br />then a note.</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed">Set a gentle timer. When the moment ends, leave a short reflection. Optionally drop a local file. Publish a permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Apple-style springs on frosted glass.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            className="glass rounded-3xl p-8 text-center"
          >
            <div className="relative w-56 h-56 mx-auto mb-8">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={accent}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="263.9"
                  initial={false}
                  animate={{ strokeDashoffset: 263.9 * (1 - progress) }}
                  transition={{ type: 'spring', stiffness: 60, damping: 18 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  key={secondsLeft}
                  initial={{ opacity: 0.6, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-semibold tracking-tight tabular-nums"
                >
                  {format(secondsLeft)}
                </motion.div>
                <p className="text-xs text-neutral-500 mt-1">{running ? 'focusing' : secondsLeft === 0 ? 'complete' : 'ready'}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <button onClick={() => setMinutes(Math.max(1, minutes - 5))} className="w-10 h-10 rounded-full bg-white/5 text-neutral-400 hover:text-white">−</button>
              <span className="text-sm text-neutral-400 w-16">{minutes} min</span>
              <button onClick={() => setMinutes(minutes + 5)} className="w-10 h-10 rounded-full bg-white/5 text-neutral-400 hover:text-white">+</button>
            </div>

            <div className="flex gap-3 justify-center">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setRunning(!running)}
                disabled={secondsLeft === 0 && !running}
                className="px-8 py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-40"
              >
                {running ? 'pause' : secondsLeft === 0 ? 'done' : 'start'}
              </motion.button>
              <button
                onClick={() => {
                  setRunning(false);
                  setSecondsLeft(minutes * 60);
                }}
                className="px-6 py-3 rounded-full bg-white/5 text-sm text-neutral-400 hover:text-white"
              >
                reset
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.08 }}
            className="space-y-5"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="session title"
              className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-base outline-none focus:border-[#0A84FF]/50 transition"
            />
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="what stayed with you…"
              rows={5}
              className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-sm outline-none focus:border-[#0A84FF]/50 transition resize-none"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-neutral-500">accent</label>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent" />
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              className="border border-dashed border-white/10 rounded-2xl p-5 text-center cursor-pointer hover:border-white/20 transition bg-white/[0.015]"
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-neutral-500">{prettySize(file.size)}{file.size > 40 * 1024 * 1024 ? ' · large — browser may feel slow' : ''}</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onFile(null); }} className="text-xs text-neutral-400 hover:text-white">remove</button>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">optional local file</p>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={publish}
              disabled={publishing}
              className="w-full py-3.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
            >
              {publishing ? 'publishing…' : 'publish reflection'}
            </motion.button>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          </motion.div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 text-center space-y-4"
            >
              <p className="text-sm text-neutral-400">reflection is live</p>
              <button
                onClick={() => navigator.clipboard.writeText(result.url)}
                className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium"
              >
                copy share link
              </button>
              {result.warn && <p className="text-xs text-amber-400">{result.warn}</p>}
              <button onClick={() => navigate('home')} className="block mx-auto text-sm text-neutral-500 hover:text-white">← back home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
