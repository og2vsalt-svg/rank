import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietstreamPage() {
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [stream, setStream] = useState<CloudMeta[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(16).then(setStream).catch(() => {});
  }, []);

  const addFile = useCallback((f: File) => {
    setWarn(f.size > 40_000_000 ? 'Large file — the stream may pause briefly. No hard limits.' : null);
    setFile(f);
    setLink(null);
  }, []);

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || file.name,
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'quietstream' },
      });
      if (res.ok && res.embed) {
        setLink(res.embed);
        listPublicShares(16).then(setStream).catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quietstream</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Into the stream.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop a local file into the quiet stream. It joins the recent flow with a polished Discord embed. Soft size warnings only. Apple-style motion on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files[0]) addFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-12 text-center mb-6 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">{file ? file.name : 'Drop a file into the stream'}</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0])}
            />
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional note for the stream"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
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
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Joining the stream…' : file ? 'Join the stream' : 'Drop a file first'}
          </motion.button>

          {link && (
            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-center text-sm text-blue-400"
            >
              {link}
            </motion.a>
          )}
        </motion.div>

        <div className="mt-12 space-y-4">
          <p className="text-[13px] text-neutral-500">the quiet stream</p>
          <AnimatePresence>
            {stream.map((r, i) => (
              <motion.a
                key={r.id}
                href={`/s/${r.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition"
              >
                <p className="text-sm font-medium truncate">{r.name || 'shared file'}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{r.caption || 'no note'} · {(r.size / 1024).toFixed(0)} KB</p>
              </motion.a>
            ))}
          </AnimatePresence>
          {stream.length === 0 && <p className="text-neutral-500 text-sm">the stream is quiet for now.</p>}
        </div>
      </div>
    </div>
  );
}
