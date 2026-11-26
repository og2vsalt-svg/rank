import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const ACCENTS = [
  { name: 'Apple Blue', hex: '#0A84FF' },
  { name: 'Soft Violet', hex: '#BF5AF2' },
  { name: 'Mint', hex: '#30D158' },
  { name: 'Warm Orange', hex: '#FF9F0A' },
  { name: 'Rose', hex: '#FF375F' },
];

export default function PrismJournalPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [title, setTitle] = useState('a quiet note');
  const [body, setBody] = useState('');
  const [caption, setCaption] = useState('shared from prism journal');
  const [accent, setAccent] = useState('#0A84FF');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ name: string; id: string; url: string; warn?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
    // soft warning only
    arr.forEach((f) => {
      if (f.size > 40 * 1024 * 1024) {
        // handled at publish time
      }
    });
  }, []);

  const publish = useCallback(async () => {
    if (!body.trim() && files.length === 0) {
      setError('write a note or attach something');
      return;
    }
    setUploading(true);
    setError(null);
    setResults([]);

    const newResults: typeof results = [];

    // publish the journal note as a text file
    if (body.trim()) {
      const noteText = `# ${title}\n\n${body}\n\n— prism journal`;
      const blob = new Blob([noteText], { type: 'text/markdown' });
      const noteFile = new File([blob], `${title.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'note'}.md`, { type: 'text/markdown' });
      try {
        const pub = await publishLocalFile(noteFile, {
          caption,
          cardTitle: title,
          color: accent,
          meta: { kind: 'prism-journal' },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          newResults.push({ name: noteFile.name, id: pub.id, url: urls.embed, warn: pub.warn || undefined });
        }
      } catch (e: any) {
        setError(e?.message || 'note publish failed');
      }
    }

    // publish each attachment
    for (const file of files) {
      try {
        const pub = await publishLocalFile(file, {
          caption: caption || title,
          cardTitle: title,
          color: accent,
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          newResults.push({ name: file.name, id: pub.id, url: urls.embed, warn: pub.warn || undefined });
        }
      } catch (e: any) {
        setError((prev) => prev || e?.message || 'attachment failed');
      }
    }

    if (files.length) await addFiles(files, 'prismjournal');

    setResults(newResults);
    setUploading(false);
    if (newResults.length === 0) setError('nothing published');
  }, [body, title, caption, accent, files, addFiles]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="text-center mb-10"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">prism journal</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">write quietly.<br />share beautifully.</h1>
          <p className="text-neutral-400 text-lg">A note and optional files become permanent Discord-ready shares. Soft size warnings only. No hard limits.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 120, damping: 24 }}
          className="space-y-5"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5 text-base text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#0A84FF]/40 transition"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="your note…"
            rows={8}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#0A84FF]/40 transition resize-none leading-relaxed"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="embed caption"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#0A84FF]/40 transition"
          />

          <div className="flex flex-wrap gap-2 justify-center pt-1">
            {ACCENTS.map((a) => (
              <button
                key={a.hex}
                onClick={() => setAccent(a.hex)}
                className={`w-9 h-9 rounded-full border-2 transition-all ${accent === a.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: a.hex }}
                title={a.name}
              />
            ))}
          </div>

          <div
            className="border border-dashed border-white/15 rounded-2xl p-6 text-center bg-white/[0.015] cursor-pointer hover:border-white/25 transition"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <p className="text-sm text-neutral-400">optional attachments — drop or click</p>
            {files.length > 0 && (
              <p className="text-xs text-neutral-500 mt-2">{files.length} file{files.length > 1 ? 's' : ''} ready</p>
            )}
          </div>

          <motion.button
            onClick={publish}
            disabled={uploading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-2xl text-white font-medium text-sm transition disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {uploading ? 'publishing…' : 'publish shares'}
          </motion.button>
        </motion.div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-sm text-red-400">{error}</motion.p>
        )}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 space-y-3"
            >
              <p className="text-sm text-neutral-400">shares ready — Discord embeds use your title, caption & accent</p>
              {results.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    {r.warn && <p className="text-xs text-amber-400 mt-0.5">{r.warn}</p>}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url)}
                    className="px-4 py-1.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: accent }}
                  >
                    copy
                  </button>
                </motion.div>
              ))}
              <button onClick={() => navigate('home')} className="mt-2 text-sm text-neutral-500 hover:text-white transition">← home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
