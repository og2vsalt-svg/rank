import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietFocusPage() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'publishing' | 'done'>('idle');
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s > 0) return s - 1;
        if (minutes > 0) {
          setMinutes((m) => m - 1);
          return 59;
        }
        setRunning(false);
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, minutes]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      if (f.size > 40 * 1024 * 1024) setWarn('chunky file. may feel slow. no hard limit.');
    }
  }, []);

  const publish = async () => {
    if (status === 'publishing') return;
    setStatus('publishing');
    try {
      const body = `Focus session\nDuration goal: ${minutes + seconds / 60} min\nNote: ${note || '(none)'}\nCompleted at: ${new Date().toISOString()}`;
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption: note || 'Focus session share',
          cardTitle: 'Quiet Focus',
          meta: { desk: 'quietfocus', note },
        });
      } else {
        const blob = new Blob([body], { type: 'text/plain' });
        const f = new File([blob], 'focus-log.txt', { type: 'text/plain' });
        res = await publishLocalFile(f, {
          caption: note.slice(0, 120) || 'Focus log',
          cardTitle: 'Quiet Focus',
          meta: { desk: 'quietfocus' },
        });
      }
      if (res.ok) {
        setStatus('done');
        setLink(res.embed || null);
        setWarn(res.warn || null);
      }
    } catch {
      setStatus('idle');
    }
  };

  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 text-center"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#FF9500] mb-3">Quiet Focus</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-2">A still timer.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Soft Apple-style motion. Start a focus session. Optionally drop a file or leave a note. Share the moment to the database with a polished Discord embed. Soft size warnings only.
          </p>

          <motion.div
            animate={{ scale: running ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-6xl font-semibold tracking-tight tabular-nums mb-8"
          >
            {display}
          </motion.div>

          <div className="flex gap-3 justify-center mb-8">
            <button onClick={() => setRunning(true)} className="px-6 py-2.5 rounded-full bg-[#F5F5F7] text-black text-sm font-medium">start</button>
            <button onClick={() => setRunning(false)} className="px-6 py-2.5 rounded-full bg-white/10 text-sm">pause</button>
            <button onClick={() => { setRunning(false); setMinutes(25); setSeconds(0); }} className="px-6 py-2.5 rounded-full bg-white/10 text-sm">reset</button>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border border-dashed border-white/15 rounded-3xl p-6 mb-6"
          >
            {file ? <p className="text-sm">{file.name}</p> : <p className="text-neutral-500 text-sm">optional file drop</p>}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Session note…"
            className="w-full h-20 bg-white/5 border border-white/10 rounded-3xl px-5 py-3 text-sm outline-none mb-6 resize-none"
          />

          {warn && <p className="text-xs text-amber-400 mb-4">{warn}</p>}

          <button
            onClick={publish}
            disabled={status === 'publishing'}
            className="w-full py-3.5 rounded-full bg-[#FF9500] text-black text-sm font-medium disabled:opacity-50"
          >
            {status === 'publishing' ? 'settling…' : 'share the focus'}
          </button>

          {link && <a href={link} target="_blank" rel="noreferrer" className="block mt-4 text-sm underline">open link</a>}
        </motion.div>
      </div>
    </div>
  );
}
