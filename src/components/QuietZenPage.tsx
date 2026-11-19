import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietZenPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'publishing' | 'done' | 'error'>('idle');
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [breath, setBreath] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setBreath((b) => (b + 1) % 8), 1000);
    return () => clearInterval(id);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
      else setPreview(null);
      if (f.size > 40 * 1024 * 1024) setWarn('large file. may feel slow. no hard limit.');
      else setWarn(null);
    }
  }, []);

  const publish = async () => {
    if (status === 'publishing') return;
    setStatus('publishing');
    setError(null);
    try {
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption: note || 'A quiet zen moment',
          cardTitle: 'Quiet Zen',
          meta: { desk: 'quietzen' },
        });
      } else if (note.trim()) {
        const blob = new Blob([note], { type: 'text/plain' });
        const f = new File([blob], 'zen-note.txt', { type: 'text/plain' });
        res = await publishLocalFile(f, {
          caption: note.slice(0, 140),
          cardTitle: 'Quiet Zen Note',
          meta: { desk: 'quietzen' },
        });
      } else {
        setStatus('error');
        setError('drop a file or write a note');
        return;
      }
      if (res.ok) {
        setStatus('done');
        setLink(res.embed || null);
        setWarn(res.warn || null);
      } else {
        setStatus('error');
        setError(res.error || 'could not settle');
      }
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'failed');
    }
  };

  const scale = 0.9 + Math.sin(breath * Math.PI / 4) * 0.15;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[40px] p-8 md:p-12 text-center"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#5E5CE6] mb-3">Quiet Zen</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-4">Breathe. Drop. Share.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-10">
            A still center. Soft breathing motion on frosted glass. Drop a local file or write a quiet note. It settles into the database with a polished Discord embed. Soft size warnings only. No hard limits.
          </p>

          <div className="flex justify-center mb-10">
            <motion.div
              animate={{ scale }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              className="w-32 h-32 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
            >
              <span className="text-sm text-neutral-300">{breath % 2 === 0 ? 'in' : 'out'}</span>
            </motion.div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-white/15 rounded-3xl p-8 mb-6 hover:border-white/30 transition"
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-2xl" />
            ) : file ? (
              <p className="text-sm">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
            ) : (
              <p className="text-neutral-500 text-sm">drop a file here, or just write below</p>
            )}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet reflection…"
            className="w-full h-24 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 text-[15px] outline-none focus:border-white/30 resize-none placeholder:text-neutral-500 mb-6"
          />

          {warn && <p className="text-xs text-amber-400 mb-4">{warn}</p>}

          <button
            onClick={publish}
            disabled={status === 'publishing'}
            className="w-full py-3.5 rounded-full bg-[#F5F5F7] text-black text-sm font-medium hover:bg-white transition disabled:opacity-50"
          >
            {status === 'publishing' ? 'settling…' : status === 'done' ? 'shared' : 'publish to the database'}
          </button>

          {link && (
            <motion.a
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              href={link} target="_blank" rel="noreferrer"
              className="block mt-4 text-sm underline text-neutral-300 hover:text-white"
            >
              open share link
            </motion.a>
          )}
          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
        </motion.div>
      </div>
    </div>
  );
}
