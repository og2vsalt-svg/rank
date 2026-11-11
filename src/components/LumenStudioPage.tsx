import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function LumenStudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const onDrop = useCallback((list: FileList | File[]) => {
    const f = Array.from(list)[0];
    if (f) {
      setFile(f);
      setTitle(f.name.replace(/\.[^.]+$/, ''));
      setStatus('idle');
      setResult(null);
      setError('');
    }
  }, []);

  const share = async () => {
    if (!file) return;
    setStatus('uploading');
    setError('');
    try {
      const res = await publishLocalFile(file, {
        caption: caption || undefined,
        color,
        cardTitle: title || file.name,
        author: 'rankvault studio',
      });
      if (res.ok && res.id) {
        const urls = shareUrls(res.id);
        setResult({ embed: urls.embed, warn: res.warn || null });
        setStatus('done');
      } else {
        setError(res.error || 'upload failed');
        setStatus('error');
      }
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  const large = file && file.size > 40 * 1024 * 1024;

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20">
      <div className="max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          lumen studio
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06 }}
          className="text-neutral-400 mb-10"
        >
          Compose a single file with title and caption. Live preview of the Discord card. Soft size notes only — never blocked.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <motion.div
              className="glass rounded-3xl p-12 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/25"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
              }}
              whileHover={{ scale: 1.004 }}
              whileTap={{ scale: 0.996 }}
            >
              <input ref={inputRef} type="file" onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="studio-file" />
              <label htmlFor="studio-file" className="cursor-pointer block">
                <div className="text-neutral-400 text-sm mb-1">drop one file</div>
                <div className="text-xs text-neutral-500">or click to browse</div>
              </label>
            </motion.div>

            {file && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <p className="text-sm truncate">{file.name}</p>
                <p className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </motion.div>
            )}

            {large && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400 text-xs mb-4">
                large file. upload may feel slow. no hard limit.
              </motion.div>
            )}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="card title"
              className="w-full glass rounded-2xl px-4 py-3 text-sm mb-3 outline-none focus:border-white/30"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="caption that appears on the Discord embed"
              rows={3}
              className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30 resize-none"
            />
            <div className="flex items-center gap-3 mb-6">
              <label className="text-xs text-neutral-400">accent</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={share}
              disabled={!file || status === 'uploading'}
              className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-50"
            >
              {status === 'uploading' ? 'publishing…' : 'publish to database'}
            </motion.button>

            <AnimatePresence>
              {status === 'done' && result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-2xl p-4">
                  <p className="text-xs text-neutral-400 break-all mb-2">{result.embed}</p>
                  <button onClick={() => navigator.clipboard.writeText(result.embed)} className="text-xs text-[#0A84FF]">copy embed link</button>
                  {result.warn && <p className="text-amber-400 text-xs mt-2">{result.warn}</p>}
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-400 text-sm">{error}</motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wider">live preview</p>
            <motion.div
              layout
              className="glass rounded-3xl overflow-hidden border border-white/10"
              style={{ borderTop: `3px solid ${color}` }}
            >
              {preview && (
                <img src={preview} alt="" className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <p className="font-medium text-base truncate">{title || file?.name || 'untitled'}</p>
                {caption && <p className="text-sm text-neutral-300 mt-1 line-clamp-3">{caption}</p>}
                <p className="text-[11px] text-neutral-500 mt-3">rankvault · Discord embed</p>
              </div>
            </motion.div>
            <p className="text-xs text-neutral-500 mt-4">This is how the share will appear when pasted into Discord. Professional embeds are generated automatically for every link.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
