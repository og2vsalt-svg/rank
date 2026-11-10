import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function DirectSharePage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles(arr);
    setStatus('idle');
    setResult(null);
    setError('');
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onDrop(e.target.files);
  };

  const share = async () => {
    if (!files.length) return;
    setStatus('uploading');
    setError('');
    try {
      // also keep in local vault
      await addFiles(files, 'drops');
      const file = files[0];
      const res = await publishLocalFile(file, {
        caption: caption || undefined,
        color,
        cardTitle: file.name,
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

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          direct share
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-8"
        >
          Drop a local file. It uploads to the database and returns a polished Discord embed link. Soft warnings for large files only. No hard limits.
        </motion.p>

        <div
          className="glass rounded-3xl p-8 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/20 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={onFile} className="hidden" id="file" multiple />
          <label htmlFor="file" className="cursor-pointer">
            <div className="text-neutral-500 text-sm mb-2">drag files here or click</div>
            {files.length > 0 && (
              <div className="text-sm font-medium">{files.map(f => f.name).join(', ')}</div>
            )}
          </label>
        </div>

        {files.some(f => f.size > 40 * 1024 * 1024) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400 text-xs mb-4">
            large drop detected. the browser may feel slow while encoding or uploading. no hard limit.
          </motion.div>
        )}

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional caption for the Discord card"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
        />

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-neutral-400">accent</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={share}
          disabled={!files.length || status === 'uploading'}
          className="w-full py-3 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-50"
        >
          {status === 'uploading' ? 'uploading…' : 'share to database'}
        </motion.button>

        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-5"
            >
              <p className="text-sm font-medium mb-2">shared</p>
              <p className="text-xs text-neutral-400 break-all mb-3">{result.embed}</p>
              {result.warn && <p className="text-amber-400 text-xs mb-2">{result.warn}</p>}
              <button
                onClick={() => navigator.clipboard.writeText(result.embed)}
                className="text-xs text-[#0A84FF]"
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
  );
}
