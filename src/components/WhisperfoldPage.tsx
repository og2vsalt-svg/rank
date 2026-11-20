import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function WhisperfoldPage() {
  const [file, setFile] = useState<File | null>(null);
  const [whisper, setWhisper] = useState('');
  const [accent, setAccent] = useState('#BF5AF2');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    if (f && f.size > 35_000_000) setWarn('Large file — may take a moment. No hard limits.');
    else setWarn(null);
    setLink(null);
  }, []);

  const publish = async () => {
    if (busy) return;
    if (!file && !whisper.trim()) return;
    setBusy(true);
    try {
      if (file) {
        const res = await publishLocalFile(file, {
          caption: whisper.trim() || file.name,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'whisperfold', whisper: whisper.trim() },
        });
        if (res.ok && res.embed) setLink(res.embed);
        else setWarn(res.error || 'quiet failure');
      } else {
        // note-only path — for now require file to land in DB
        setWarn('attach a file to fold the whisper into the database');
      }
    } catch (e: any) {
      setWarn(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 23 }}
          className="glass rounded-[38px] p-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-3" style={{ color: accent }}>Whisperfold</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-4">Fold a note.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed mb-10">
            A folded whisper with an optional file. Lands in the database. Share links carry polished Discord embeds. Soft warnings for large files. Sleek Apple-style animations on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              onFile(e.dataTransfer.files[0] || null);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-3xl p-14 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/15"
          >
            {file ? (
              <div>
                <p className="text-neutral-200 text-[15px] font-medium">{file.name}</p>
                <p className="text-neutral-500 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
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
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </div>

          <textarea
            value={whisper}
            onChange={(e) => setWhisper(e.target.value)}
            placeholder="the folded whisper"
            rows={5}
            className="w-full bg-black/25 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-8">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-6">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || (!file && !whisper.trim())}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Folding…' : 'Fold and share'}
          </motion.button>

          {link && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 glass rounded-2xl p-5"
            >
              <p className="text-sm text-neutral-400 mb-2">Share link (Discord-ready)</p>
              <a href={link} target="_blank" rel="noreferrer" className="text-blue-400 text-sm break-all">{link}</a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
