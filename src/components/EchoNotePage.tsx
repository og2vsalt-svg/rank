import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function EchoNotePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('A quiet note');
  const [accent, setAccent] = useState('#0A84FF');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCENTS = ['#0A84FF', '#AF52DE', '#30D158', '#FF9F0A', '#FF375F', '#64D2FF'];

  const publish = useCallback(async () => {
    if (!note.trim() && !file) {
      setError('write a note or attach a file');
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      if (file) {
        await addFiles([file], 'echonote');
        const pub = await publishLocalFile(file, {
          caption: note || 'shared note',
          cardTitle: title,
          color: accent,
          meta: { note: note.slice(0, 2000) },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          setResult({ url: urls.embed, warn: pub.warn || undefined });
        } else {
          setError(pub.error || 'could not publish');
        }
      } else {
        // pure note — create a tiny text file
        const blob = new Blob([note], { type: 'text/plain' });
        const noteFile = new File([blob], `${title.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'note'}.txt`, { type: 'text/plain' });
        await addFiles([noteFile], 'echonote');
        const pub = await publishLocalFile(noteFile, {
          caption: note.slice(0, 280),
          cardTitle: title,
          color: accent,
          meta: { pureNote: true },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          setResult({ url: urls.embed, warn: pub.warn || undefined });
        } else {
          setError(pub.error || 'could not publish note');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
    }
    setUploading(false);
  }, [note, title, accent, file, addFiles]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">echo note</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">leave a quiet mark.</h1>
          <p className="text-neutral-400 text-lg">Write a note. Optionally attach a file. Shape the Discord embed. Soft warnings only.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 120, damping: 24 }}
          className="space-y-5"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title for the embed"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#0A84FF]/40 transition"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="the note itself…"
            rows={6}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#0A84FF]/40 transition resize-none leading-relaxed"
          />

          <div className="flex flex-wrap gap-2 justify-center">
            {ACCENTS.map((hex) => (
              <button
                key={hex}
                onClick={() => setAccent(hex)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${accent === hex ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-white/20 transition bg-white/[0.015]"
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <p className="text-sm">{file.name} <span className="text-neutral-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span></p>
            ) : (
              <p className="text-sm text-neutral-500">optional file — click to attach</p>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={uploading}
            className="w-full py-3.5 rounded-2xl bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ backgroundColor: accent }}
          >
            {uploading ? 'sending…' : 'publish echo'}
          </motion.button>
        </motion.div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-sm text-red-400">{error}</motion.p>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center"
            >
              <p className="text-sm text-neutral-400 mb-3">ready</p>
              {result.warn && <p className="text-xs text-amber-400 mb-3">{result.warn}</p>}
              <button
                onClick={() => navigator.clipboard.writeText(result.url)}
                className="px-5 py-2 rounded-full text-white text-xs font-medium"
                style={{ backgroundColor: accent }}
              >
                copy Discord-ready link
              </button>
              <button onClick={() => navigate('home')} className="block mx-auto mt-4 text-xs text-neutral-500 hover:text-white">back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
