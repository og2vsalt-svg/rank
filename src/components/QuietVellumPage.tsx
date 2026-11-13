import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function QuietVellumPage() {
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FFD60A');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string } | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(5).then(setRecent).catch(() => {});
  }, []);

  const onFile = useCallback((list: FileList | File[]) => {
    const f = Array.from(list)[0];
    if (!f) return;
    if (f.size > 40 * 1024 * 1024) {
      setWarn('large file detected. the browser may feel slow while uploading. no hard limit.');
    } else setWarn(null);
    setFile(f);
    setStatus('idle');
  }, []);

  const publish = async () => {
    if (!note.trim() && !file && !title.trim()) return;
    setStatus('uploading');
    const cardTitle = title.trim() || 'vellum note';
    const noteText = note.trim() || '(attached file)';
    const blob = new Blob([`${cardTitle}\n\n${noteText}`], { type: 'text/plain' });
    const textFile = file || new File([blob], `${cardTitle.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'vellum'}.txt`, { type: 'text/plain' });
    const res = await publishLocalFile(textFile, {
      caption: caption || noteText.slice(0, 280),
      color,
      cardTitle,
      author: 'rankvault',
      meta: { desk: 'quietvellum', title: cardTitle, note: noteText.slice(0, 4000) },
    });
    if (res.ok && res.id) {
      setResult({ id: res.id, embed: shareUrls(res.id).embed });
      setNote('');
      setTitle('');
      setFile(null);
      setCaption('');
      listPublicShares(5).then(setRecent).catch(() => {});
    }
    setStatus('done');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="min-h-screen bg-transparent text-white pt-24 px-5 pb-16 relative overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none blur-md"
            style={{
              width: 8 + (i % 3) * 6,
              height: 8 + (i % 3) * 6,
              background: color,
              left: `${10 + (i * 16) % 80}%`,
              top: `${20 + (i * 11) % 55}%`,
              opacity: 0.12,
            }}
            animate={{
              y: [0, -8, 0],
              opacity: [0.08, 0.2, 0.08],
            }}
            transition={{ duration: 6 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          />
        ))}

        <div className="max-w-5xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="text-4xl font-semibold tracking-tight mb-2"
          >
            quiet vellum
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 mb-8 max-w-2xl"
          >
            Write a quiet note on soft vellum. Optional title, optional local file, warm accent. Settles into storage with spring motion. Every share link unfurls a polished Discord embed. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <input
                type="text"
                placeholder="optional title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/30"
              />

              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="your quiet note…"
                className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 text-sm outline-none focus:border-white/30 resize-none"
              />

              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files); }}
                className="mt-4 block rounded-3xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center cursor-pointer hover:border-white/40 transition"
              >
                <input type="file" className="hidden" onChange={e => e.target.files && onFile(e.target.files)} />
                <div className="text-sm font-medium">{file ? file.name : 'optional local file'}</div>
                <div className="text-xs text-neutral-500 mt-1">or click to browse · soft size warnings only</div>
                {warn && <div className="mt-2 text-amber-300 text-xs">{warn}</div>}
              </label>

              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="shared caption (optional)"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/30"
                />
                <div className="flex gap-4 items-center">
                  <label className="text-sm text-neutral-400">vellum accent</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border-0" />
                </div>
                <button
                  onClick={publish}
                  disabled={(!note.trim() && !file && !title.trim()) || status === 'uploading'}
                  className="w-full rounded-2xl bg-white text-black font-medium py-3 disabled:opacity-40 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {status === 'uploading' ? 'binding the note…' : 'publish vellum'}
                </button>
              </div>

              <AnimatePresence>
                {result && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white/5 rounded-2xl p-4">
                    <div className="font-medium">shared</div>
                    <a href={result.embed} className="text-sm text-blue-400 mt-2 inline-block" target="_blank" rel="noreferrer">{result.embed}</a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4">live preview</h2>
              <motion.div
                className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-h-[200px]"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              >
                {title && <div className="text-base font-medium mb-2">{title}</div>}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{note || 'your note will settle here…'}</div>
                {file && <div className="mt-4 text-xs text-neutral-500">attached: {file.name}</div>}
                {caption && <div className="mt-3 text-xs italic text-neutral-400">caption: {caption}</div>}
              </motion.div>

              <h2 className="text-lg font-medium mt-8 mb-4">recent notes</h2>
              <div className="space-y-3">
                {recent.map(item => (
                  <motion.a
                    key={item.id}
                    href={`/s/${item.id}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="block bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition"
                  >
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.caption || 'shared from rankvault'}</div>
                  </motion.a>
                ))}
                {recent.length === 0 && <div className="text-neutral-500 text-sm">no public notes yet</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
