import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SunrisePage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF9500');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File) => {
    setFile(f);
    setWarn(f.size > 60_000_000 ? 'Large files may feel slower. No hard limits.' : null);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setLink(null);
    setError(null);
  }, []);

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || file.name,
        color,
        cardTitle: file.name,
        meta: { desk: 'sunrise', accent: color },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'Could not share');
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#FF9500] mb-2">Sunrise</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Warm shares.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop a local file, choose a soft accent, add a quiet caption. Publishes to the library with a polished Discord embed. Soft size warnings only.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#FF9500]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#FF9500]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#FF9500]/40');
              if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            {preview ? (
              <img src={preview} alt="" className="max-h-48 mx-auto rounded-2xl object-cover" />
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">Drop a file or photo</p>
                <p className="text-neutral-500 text-sm mt-1">or click to browse</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </div>

          {file && (
            <p className="text-xs text-neutral-500 mb-5 text-center">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
          )}

          <div className="flex items-center gap-3 mb-5">
            <label className="text-sm text-neutral-400">Accent</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent"
            />
            <span className="text-xs text-neutral-500">{color}</span>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional quiet caption"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}
          {error && <p className="text-[13px] text-red-400 mb-5">{error}</p>}
          {link && (
            <button
              onClick={() => navigate('share', link.split('/').pop() || '')}
              className="block w-full text-center text-sm text-[#FF9500] mb-5 truncate"
            >
              {link}
            </button>
          )}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#FF9500]"
          >
            {busy ? 'Sharing…' : 'Share with sunrise'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
