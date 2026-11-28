import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function VelvetNotePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('Velvet Note');
  const [accent, setAccent] = useState('#AF52DE');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ id: string; url: string; warn?: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePublish = useCallback(async () => {
    if (!note.trim() && !file) {
      setError('write a note or attach a file');
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      if (file) {
        await addFiles([file], 'velvetnote');
        setProgress(40);
        const pub = await publishLocalFile(file, {
          caption: note || 'A quiet note.',
          cardTitle: title || file.name,
          color: accent,
          meta: { kind: 'velvet-note', text: note },
        });
        setProgress(90);
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          setResult({
            id: pub.id,
            url: urls.embed,
            warn: pub.warn || undefined,
            name: file.name,
          });
        } else {
          setError(pub.error || 'could not publish');
        }
      } else {
        // pure text note: store as a tiny text file
        const blob = new Blob([note], { type: 'text/plain' });
        const textFile = new File([blob], `${title || 'note'}.txt`, { type: 'text/plain' });
        setProgress(50);
        const pub = await publishLocalFile(textFile, {
          caption: note,
          cardTitle: title,
          color: accent,
          meta: { kind: 'velvet-note', pureText: true },
        });
        setProgress(90);
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          setResult({
            id: pub.id,
            url: urls.embed,
            warn: pub.warn || undefined,
            name: textFile.name,
          });
        } else {
          setError(pub.error || 'could not publish note');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'something went quiet');
    }
    setProgress(100);
    setUploading(false);
  }, [note, title, accent, file, addFiles]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 16 }}
          className="text-center mb-12"
        >
          <p className="text-[#AF52DE] text-sm tracking-wide mb-3">velvet note</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 leading-tight">write quietly.<br />share forever.</h1>
          <p className="text-neutral-400 text-base max-w-xl mx-auto leading-relaxed">A pure text note or a note with an attached file. Shape the Discord embed, then publish. Soft size warnings only — no hard limits, no boosting. Apple-style springs throughout.</p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
            className="md:col-span-3 glass rounded-3xl p-6 space-y-5"
          >
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#AF52DE]/40 transition"
                placeholder="Velvet Note"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#AF52DE]/40 resize-none leading-relaxed"
                placeholder="Write something that stays."
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="block text-xs text-neutral-500">accent</label>
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border border-white/10"
              />
              <span className="text-xs text-neutral-500">{accent}</span>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-white/30 transition"
              >
                {file ? file.name : 'attach a local file (optional)'}
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
              {file && (
                <button onClick={() => setFile(null)} className="ml-3 text-xs text-neutral-500 hover:text-white">remove</button>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handlePublish}
              disabled={uploading || (!note.trim() && !file)}
              className="w-full py-3.5 rounded-full text-white text-sm font-medium disabled:opacity-40 transition"
              style={{ background: accent }}
            >
              {uploading ? `publishing… ${progress}%` : 'publish note'}
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.08 }}
            className="md:col-span-2 flex items-start justify-center pt-2"
          >
            <div className="w-full rounded-2xl overflow-hidden" style={{ background: '#2b2d31', borderLeft: `4px solid ${accent}` }}>
              <div className="p-4">
                <div className="text-white font-semibold text-sm mb-1 truncate">{title || 'Untitled'}</div>
                <div className="text-[#dcddde] text-xs leading-relaxed line-clamp-6 whitespace-pre-wrap">{note || 'Your note will appear here.'}</div>
                {file && <div className="mt-2 text-[10px] text-[#a3a6aa]">+ {file.name}</div>}
                <div className="mt-3 text-[10px] text-[#a3a6aa]">rankvault • Discord-ready</div>
              </div>
            </div>
          </motion.div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-red-400 mt-8">{error}</motion.p>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="mt-10 glass rounded-3xl p-6 text-center"
            >
              <p className="text-sm text-neutral-400 mb-4">published. the link carries a polished Discord embed.</p>
              {result.warn && <p className="text-xs text-amber-400 mb-3">{result.warn}</p>}
              <button
                onClick={() => navigator.clipboard.writeText(result.url)}
                className="px-5 py-2.5 rounded-full text-white text-sm font-medium"
                style={{ background: accent }}
              >
                copy share link
              </button>
              <button onClick={() => navigate('home')} className="block mx-auto mt-4 text-xs text-neutral-500 hover:text-white">← back home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
