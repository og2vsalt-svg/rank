import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function EchoPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const onFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
  };

  const share = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || undefined,
        author: author.trim() || undefined,
        color,
        cardTitle: file.name,
      });
      if (!res.ok) {
        setError(res.error || 'could not echo the file');
        return;
      }
      setResult({
        id: res.id!,
        embed: res.embed || shareUrls(res.id!).embed,
        warn: res.warn,
      });
    } catch (e: any) {
      setError(e?.message || 'something went quiet');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.embed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">echo</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">
            send a file. watch it unfurl.
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed mb-10 max-w-xl">
            Drop a local file. Add a quiet caption. Echo it into the database with a professional Discord card on the link. Large drops only get a soft warning — never a refusal.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-5">
            <div
              className="glass rounded-3xl p-8 text-center border border-dashed border-white/10 hover:border-[#0A84FF]/40 transition cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files); }}
            >
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
              {file ? (
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} mb · {file.type || 'file'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-white">Drop a file to echo</p>
                  <p className="text-xs text-neutral-500 mt-1">any size. browser may slow on very large drops.</p>
                </div>
              )}
            </div>

            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="your name (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0A84FF]/50"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="a short caption for the card…"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0A84FF]/50 resize-none"
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">accent</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer"
              />
              <span className="text-xs text-neutral-400 font-mono">{color}</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!file || busy}
              onClick={share}
              className="w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-40 transition"
            >
              {busy ? 'echoing…' : 'echo the file'}
            </motion.button>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {result?.warn && <p className="text-sm text-amber-400/90">{result.warn}</p>}
          </div>

          <div className="md:col-span-2">
            <p className="text-xs text-neutral-500 mb-3 tracking-wide">discord preview</p>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                  className="glass rounded-2xl overflow-hidden border border-white/10"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div className="p-4">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">rankvault</p>
                    <p className="text-white font-medium text-sm leading-snug mb-1">{file?.name}</p>
                    {caption && <p className="text-neutral-400 text-xs leading-relaxed">{caption}</p>}
                    <p className="text-[11px] text-neutral-500 mt-3 truncate">{result.embed}</p>
                  </div>
                  <div className="px-4 pb-4">
                    <button
                      onClick={copy}
                      className="text-xs text-[#0A84FF] hover:text-[#409CFF] transition"
                    >
                      {copied ? 'copied' : 'copy link'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-2xl p-6 text-center text-neutral-500 text-sm"
                >
                  the card appears here once you echo.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
