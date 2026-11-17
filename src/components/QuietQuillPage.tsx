import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietQuillPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#FF9500');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    setStatus('idle');
    setLink('');
    setError('');
    if (f && f.size > 40 * 1024 * 1024) setWarn('Large quill \u2014 the browser may feel slower. No hard limit.');
    else setWarn(null);
  }, []);

  const publish = async () => {
    if (status === 'uploading') return;
    const toSend = file || new File([note || 'A quiet note.'], 'quill.txt', { type: 'text/plain' });
    setStatus('uploading');
    setError('');
    try {
      const res = await publishLocalFile(toSend, {
        caption: note.trim() || toSend.name,
        color: accent,
        cardTitle: file ? file.name : 'Quiet Quill',
        meta: { desk: 'quietquill' },
      });
      if (res.ok && res.embed) {
        setLink(res.embed);
        setStatus('done');
      } else {
        setError(res.error || 'could not publish');
        setStatus('error');
      }
    } catch (e: any) {
      setError(e?.message || 'failed');
      setStatus('error');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Quill</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Write or drop.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            A quiet desk for a note or a local file. The words settle with the file into the database. Every share link carries a polished Discord embed. Soft size warnings only \u2014 never hard limits. Apple-style spring motion on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-12 text-center mb-6 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">{file ? file.name : 'Drop a file (optional)'}</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose \u00b7 or just write below</p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write a quiet note..."
            rows={5}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={status === 'uploading' || (!file && !note.trim())}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {status === 'uploading' ? 'Inking\u2026' : status === 'done' ? 'Published' : 'Publish to database'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-2xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Discord-ready link</p>
              <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{link}</a>
              <button onClick={() => navigator.clipboard.writeText(link)} className="block text-xs text-[#0A84FF] mt-2">copy</button>
            </motion.div>
          )}
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </motion.div>
      </div>
    </div>
  );
}
