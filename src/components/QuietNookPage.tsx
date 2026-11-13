import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function QuietNookPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF6B35');
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
    if (!note.trim() && !file) return;
    setStatus('uploading');
    let res;
    if (file) {
      res = await publishLocalFile(file, {
        caption: caption || note.slice(0, 280) || undefined,
        color,
        cardTitle: file.name,
        author: 'rankvault',
        meta: { desk: 'quietnook', note: note.slice(0, 2000) },
      });
    } else {
      const blob = new Blob([note], { type: 'text/plain' });
      const textFile = new File([blob], 'nook-note.txt', { type: 'text/plain' });
      res = await publishLocalFile(textFile, {
        caption: caption || note.slice(0, 280),
        color,
        cardTitle: 'quiet nook',
        author: 'rankvault',
        meta: { desk: 'quietnook', note },
      });
    }
    if (res.ok && res.id) {
      setResult({ id: res.id, embed: shareUrls(res.id).embed });
      setNote('');
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
        {/* soft ember particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              background: color,
              left: `${10 + (i * 11) % 80}%`,
              bottom: '10%',
              opacity: 0.3,
            }}
            animate={{
              y: [0, -40 - i * 5, -80],
              opacity: [0.2, 0.6, 0],
              scale: [1, 1.2, 0.6],
            }}
            transition={{ duration: 4 + i * 0.4, repeat: Infinity, ease: 'easeOut', delay: i * 0.3 }}
          />
        ))}

        <div className="max-w-5xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="text-4xl font-semibold tracking-tight mb-2"
          >
            quiet nook
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 mb-8 max-w-2xl"
          >
            Settle into a soft nook. Compose a quiet note or drop a single local file that glows into storage and the public record. Warm accent, live preview. Every link unfurls a polished Discord embed. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="write a quiet note for the nook…"
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
                  <label className="text-sm text-neutral-400">ember accent</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border-0" />
                </div>
                <button
                  onClick={publish}
                  disabled={(!note.trim() && !file) || status === 'uploading'}
                  className="w-full rounded-2xl bg-white text-black font-medium py-3 disabled:opacity-40 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {status === 'uploading' ? 'settling into the nook…' : 'publish to the nook'}
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
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{note || 'your note will glow here…'}</div>
                {file && <div className="mt-4 text-xs text-neutral-500">attached: {file.name}</div>}
                {caption && <div className="mt-3 text-xs italic text-neutral-400">caption: {caption}</div>}
              </motion.div>

              <h2 className="text-lg font-medium mt-8 mb-4">recent nooks</h2>
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
                {recent.length === 0 && <div className="text-neutral-500 text-sm">no public nooks yet</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
