import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function ForgePage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, ''));
    setWarn(f.size > 60_000_000 ? 'Large file — may take a moment. No hard limits.' : null);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
    setResult(null);
  }, []);

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || undefined,
        color,
        cardTitle: title.trim() || file.name,
        meta: { desk: 'forge' },
      });
      if (res.ok && res.id) {
        setResult({ link: shareUrls(res.id).app });
      } else {
        setResult({ error: res.error || 'Could not forge the share.' });
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Forge</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Craft a share.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop a local file, shape its title, caption, and accent, then forge a permanent link with a polished Discord embed. Soft size warnings only.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#0A84FF]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40');
              if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            {preview ? (
              <img src={preview} alt="" className="max-h-40 mx-auto rounded-2xl object-contain" />
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">Drop a file here</p>
                <p className="text-neutral-500 text-sm mt-1">or click to browse</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {file && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Share title"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
              />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Quiet caption"
                rows={2}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm text-neutral-400">Accent</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
                />
                <span className="text-xs text-neutral-500">{color}</span>
              </div>
              {warn && <p className="text-[13px] text-amber-300/80">{warn}</p>}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Forging…' : file ? 'Forge share' : 'Drop a file first'}
          </motion.button>

          {result?.link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 glass rounded-2xl p-4">
              <p className="text-sm text-neutral-400 mb-1">Ready</p>
              <button onClick={() => navigate('share', result.link!.split('/').pop() || '')} className="text-[#0A84FF] text-sm break-all text-left">{result.link}</button>
            </motion.div>
          )}
          {result?.error && <p className="text-sm text-red-400 mt-4">{result.error}</p>}
        </motion.div>
      </div>
    </div>
  );
}
