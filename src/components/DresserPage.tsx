import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function DresserPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; url: string; embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) pick(f);
  };

  const pick = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const share = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await publishLocalFile(file, { caption: caption || undefined });
      if (!res.ok) {
        setError(res.error || 'could not file');
        return;
      }
      setResult({
        id: res.id!,
        url: res.url!,
        embed: res.embed || shareUrls(res.id!).embed,
        warn: res.warn,
      });
    } catch (e: any) {
      setError(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[36px] p-8 md:p-10"
        >
          <p className="text-[#0a84ff] text-sm font-medium tracking-wide mb-2">dresser</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-3">drop a file. share the link.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            One local file lands in storage and the share table. Discord unfurls the card. Large drops are warned, never refused. Older desks stay.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="relative rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.03] p-10 text-center cursor-pointer hover:border-[#0a84ff]/40 hover:bg-white/[0.05] transition-all duration-500"
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
            />
            <motion.div animate={{ scale: file ? 1 : 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <p className="text-neutral-300 text-sm mb-1">{file ? file.name : 'drop a file here or click'}</p>
              <p className="text-neutral-500 text-xs">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'any size. only a slowness note if huge.'}</p>
            </motion.div>
          </div>

          <AnimatePresence>
            {preview && (
              <motion.img
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                src={preview}
                alt=""
                className="mt-6 w-full max-h-64 object-contain rounded-2xl bg-black/20"
              />
            )}
          </AnimatePresence>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional caption for the card"
            className="w-full mt-6 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50 transition"
          />

          <button
            onClick={share}
            disabled={!file || busy}
            className="mt-5 w-full px-6 py-3.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#409cff] active:scale-[0.98] transition"
          >
            {busy ? 'filing…' : 'file and share'}
          </button>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-2xl bg-white/[0.04] border border-white/10 p-5 space-y-3"
              >
                <p className="text-sm text-white font-medium">filed</p>
                {result.warn && <p className="text-xs text-amber-300">{result.warn}</p>}
                <div className="flex items-center gap-2">
                  <input readOnly value={result.embed} className="flex-1 px-3 py-2 rounded-xl bg-black/30 text-xs text-neutral-300 outline-none" />
                  <button onClick={() => copy(result.embed)} className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium">copy</button>
                </div>
                <p className="text-xs text-neutral-500">paste in Discord for the pro card. the file is public until you say otherwise.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
