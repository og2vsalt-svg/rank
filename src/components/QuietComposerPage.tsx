import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietComposerPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    setPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'Large file — may feel slow to send. No hard limits.' : null);
  };

  const publish = async () => {
    if (busy) return;
    if (!note.trim() && !file) return;
    setBusy(true);
    setResult(null);
    try {
      if (file) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || file.name,
          cardTitle: file.name,
          meta: { desk: 'composer', note: note.trim() },
        });
        setResult(res.ok ? { link: res.embed } : { error: res.error });
      } else {
        // Note-only: create a small text file
        const blob = new Blob([note], { type: 'text/plain' });
        const textFile = new File([blob], 'quiet-note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(textFile, {
          caption: note.slice(0, 120),
          cardTitle: 'Quiet Note',
          meta: { desk: 'composer' },
        });
        setResult(res.ok ? { link: res.embed } : { error: res.error });
      }
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setBusy(false);
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
          <p className="text-[13px] font-medium tracking-wide text-[#AF52DE] mb-2">Quiet Composer</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Write a quiet note.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Attach a local file if the words need company, or let the note alone become the share. Settles into the database with a polished Discord embed. Soft size warnings only. Apple-style springs on frosted glass.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet thought…"
            rows={5}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-8 text-center mb-5 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            {preview ? (
              <img src={preview} alt="" className="max-h-40 mx-auto rounded-xl" />
            ) : file ? (
              <p className="text-neutral-300">{file.name}</p>
            ) : (
              <p className="text-neutral-400 text-sm">Optional file — click to attach</p>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy || (!note.trim() && !file)}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#AF52DE]"
          >
            {busy ? 'Composing…' : 'Publish quiet share'}
          </motion.button>

          {result?.link && (
            <p className="mt-5 text-sm text-blue-400">
              <a href={result.link} target="_blank" rel="noreferrer">{result.link}</a>
            </p>
          )}
          {result?.error && <p className="mt-5 text-sm text-red-400">{result.error}</p>}
        </motion.div>
      </div>
    </div>
  );
}
