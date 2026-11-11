import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function LumenQuillPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState('#0A84FF');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (arr.length) setFile(arr[0]);
    setStatus('idle');
    setResult(null);
    setError('');
  }, []);

  const share = async () => {
    if (!note.trim() && !file) return;
    setStatus('uploading');
    setError('');
    try {
      let toShare = file;
      if (!toShare && note.trim()) {
        // pure note becomes a small text file
        const blob = new Blob([note], { type: 'text/plain' });
        toShare = new File([blob], (title || 'note').replace(/[^a-z0-9._-]/gi, '_') + '.txt', { type: 'text/plain' });
      }
      if (!toShare) {
        setError('nothing to share');
        setStatus('error');
        return;
      }
      const res = await publishLocalFile(toShare, {
        caption: note.trim() || undefined,
        color,
        cardTitle: title.trim() || toShare.name,
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
          lumen quill
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-8"
        >
          Compose a quiet note, optionally attach a local file, and publish both to the database. Soft spring preview. Discord embed on the link. Large files only get a gentle slow warning.
        </motion.p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="optional title"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="write your note here…"
          rows={5}
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none resize-none"
        />

        <div
          className="glass rounded-3xl p-6 mb-4 text-center cursor-pointer border border-white/10 hover:border-white/20 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="quillfile" />
          <label htmlFor="quillfile" className="cursor-pointer text-sm text-neutral-500">
            {file ? file.name : 'optional local file — drag or click'}
          </label>
        </div>

        {file && file.size > 40 * 1024 * 1024 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400 text-xs mb-4">
            large file. the browser may feel slow while uploading. no hard limit.
          </motion.div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-neutral-400">accent</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={share}
          disabled={(!note.trim() && !file) || status === 'uploading'}
          className="w-full py-3 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-50"
        >
          {status === 'uploading' ? 'publishing…' : 'publish to database'}
        </motion.button>

        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-5"
            >
              <p className="text-sm font-medium mb-2">published</p>
              <p className="text-xs text-neutral-400 break-all mb-3">{result.embed}</p>
              {result.warn && <p className="text-amber-400 text-xs mb-2">{result.warn}</p>}
              <button
                onClick={() => navigator.clipboard.writeText(result.embed)}
                className="text-xs text-[#0A84FF]"
              >
                copy Discord link
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
