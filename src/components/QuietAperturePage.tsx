import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietAperturePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5E5CE6');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || file.name,
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'quietaperture' },
      });
      if (res.ok && res.embed) {
        setLink(res.embed);
        setWarn(res.warn || null);
      }
    } finally {
      setBusy(false);
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
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Aperture</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Frame a moment.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop one local file. Give it a caption and an accent. It settles into the database as a focused share with a polished Discord embed. Soft size warnings only. No hard limits. Apple-style springs on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-14 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">{file ? file.name : 'Drop one file here'}</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {file && file.size > 40 * 1024 * 1024 && (
            <p className="text-[13px] text-amber-300/80 mb-5">Large drop. Upload may feel slower. Never refused.</p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Framing…' : 'Frame and share'}
          </motion.button>

          {warn && <p className="text-amber-300 text-sm mt-4">large file. may feel slow. no hard limit.</p>}
          {link && (
            <div className="mt-5 glass rounded-2xl p-4">
              <p className="text-xs text-neutral-500 mb-1">share link — Discord ready</p>
              <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{link}</a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
