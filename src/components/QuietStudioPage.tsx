import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietStudioPage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles(arr);
    if (arr[0] && !title) setTitle(arr[0].name.replace(/\.[^.]+$/, ''));
    setStatus('idle');
    setResult(null);
    setError('');
  }, [title]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onDrop(e.target.files);
  };

  const previewTitle = title.trim() || (files[0]?.name ?? 'quiet studio');
  const previewCaption = caption.trim() || 'a quiet share from rankvault';

  const share = async () => {
    if (!files.length) return;
    setStatus('uploading');
    setError('');
    try {
      await addFiles(files, 'studio');
      const file = files[0];
      const res = await publishLocalFile(file, {
        caption: caption || undefined,
        color,
        cardTitle: title.trim() || file.name,
        author: 'rankvault',
      });
      if (!res.ok || !res.id) {
        setError(res.error || 'upload failed');
        setStatus('error');
        return;
      }
      const urls = shareUrls(res.id);
      setResult({ id: res.id, embed: urls.embed, warn: res.warn || null });
      setStatus('done');
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  const sizeWarn = useMemo(() => files.some(f => f.size > 40 * 1024 * 1024), [files]);

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20">
      <div className="max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2"
        >
          quiet studio
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-10 max-w-lg"
        >
          Compose a refined share. Drop a local file, shape the title and caption, then publish to the database. Live Discord-style card preview. Soft size warnings only. No hard limits. All prior desks remain.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div
              className="glass rounded-3xl p-8 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/20 transition-all"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
              }}
            >
              <input type="file" onChange={onFile} className="hidden" id="studio-file" />
              <label htmlFor="studio-file" className="cursor-pointer block">
                <div className="text-neutral-500 text-sm mb-2">drop a file or click</div>
                {files.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium">
                    {files.map(f => f.name).join(', ')}
                  </motion.div>
                )}
              </label>
            </div>

            {sizeWarn && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-amber-400 text-xs mb-4">
                large drop. the browser may feel slow while encoding or uploading. no hard limit.
              </motion.div>
            )}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="card title"
              className="w-full glass rounded-2xl px-4 py-3 text-sm mb-3 outline-none focus:ring-1 focus:ring-white/20"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="caption for the Discord embed"
              rows={3}
              className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none resize-none focus:ring-1 focus:ring-white/20"
            />

            <div className="flex items-center gap-3 mb-6">
              <label className="text-xs text-neutral-400">accent</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
              <span className="text-xs text-neutral-500">{color}</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={share}
              disabled={!files.length || status === 'uploading'}
              className="w-full py-3 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-50 transition"
            >
              {status === 'uploading' ? 'publishing…' : 'publish to database'}
            </motion.button>
          </div>

          <div>
            <p className="text-xs text-neutral-500 mb-3 tracking-wide">live preview</p>
            <motion.div
              layout
              className="glass rounded-2xl overflow-hidden border border-white/10"
              style={{ borderTop: `3px solid ${color}` }}
            >
              <div className="p-4">
                <div className="text-xs text-neutral-500 mb-1">rankvault</div>
                <div className="font-medium text-sm mb-1 leading-snug">{previewTitle}</div>
                <div className="text-xs text-neutral-400 leading-relaxed">{previewCaption}</div>
              </div>
              <div className="h-24 bg-gradient-to-br from-white/5 to-transparent flex items-end p-4">
                <span className="text-[10px] text-neutral-500">discord embed style</span>
              </div>
            </motion.div>

            <AnimatePresence>
              {status === 'done' && result && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 glass rounded-2xl p-5"
                >
                  <p className="text-sm font-medium mb-2">shared</p>
                  <p className="text-xs text-neutral-400 break-all mb-3">{result.embed}</p>
                  {result.warn && <p className="text-amber-400 text-xs mb-2">{result.warn}</p>}
                  <button
                    onClick={() => navigator.clipboard.writeText(result.embed)}
                    className="text-xs text-[#0A84FF] hover:underline"
                  >
                    copy link
                  </button>
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-400 text-sm">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
