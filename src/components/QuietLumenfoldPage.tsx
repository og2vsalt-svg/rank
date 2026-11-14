import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function QuietLumenfoldPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [color, setColor] = useState('#BF5AF2');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; embed: string; name: string }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(6).then(setRecent).catch(() => {});
  }, []);

  const onFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (!arr.length) return;
    const large = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'large attachment. the browser may feel slow while uploading. no hard limit.' : null);
    setFiles(prev => [...prev, ...arr]);
    setNotes(prev => [...prev, ...arr.map(() => '')]);
    setStatus('idle');
  }, []);

  const updateNote = (i: number, val: string) => {
    setNotes(prev => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };

  const remove = (i: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setNotes(prev => prev.filter((_, idx) => idx !== i));
  };

  const publish = async () => {
    if (!files.length) return;
    setStatus('uploading');
    const published: { id: string; embed: string; name: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const note = notes[i]?.trim() || sharedCaption.trim() || '';
      const res = await publishLocalFile(f, {
        caption: note.slice(0, 280),
        color,
        cardTitle: f.name.replace(/\.[^.]+$/, ''),
        author: 'rankvault',
        meta: { desk: 'quietlumenfold', note },
      });
      if (res.ok && res.id) {
        published.push({ id: res.id, embed: shareUrls(res.id).embed, name: f.name });
      }
    }
    setResults(published);
    setFiles([]);
    setNotes([]);
    setSharedCaption('');
    listPublicShares(6).then(setRecent).catch(() => {});
    setStatus('done');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="min-h-screen bg-transparent text-white pt-24 px-5 pb-16 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4 }}
        >
          <div className="absolute left-1/3 top-1/4 w-[480px] h-[480px] rounded-full blur-3xl" style={{ background: `${color}14` }} />
        </motion.div>

        <div className="max-w-5xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 85, damping: 20 }}
            className="text-4xl font-semibold tracking-tight mb-2"
          >
            quiet lumenfold
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 mb-8 max-w-2xl"
          >
            Soft folds of light for local files. Drop several at once. Each can carry its own quiet note, or share one caption across them. They settle as gentle frosted glass folds with spring motion. Batch-publish to the shared database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </motion.p>

          <div className="grid md:grid-cols-[1fr_300px] gap-8">
            <div className="space-y-5">
              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                className="block rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center cursor-pointer hover:border-white/30 transition"
              >
                <input type="file" multiple className="hidden" onChange={e => e.target.files && onFiles(e.target.files)} />
                <div className="text-neutral-300">drop local files or click to choose</div>
                {warn && <div className="mt-2 text-amber-300 text-xs">{warn}</div>}
              </label>

              {files.length > 0 && (
                <div className="space-y-3">
                  {files.map((f, i) => (
                    <motion.div
                      key={i + f.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                      className="bg-white/5 rounded-2xl p-4 flex gap-4 items-start"
                    >
                      <div className="flex-1">
                        <div className="font-medium truncate text-sm">{f.name}</div>
                        <input
                          type="text"
                          placeholder="quiet note for this file (optional)"
                          value={notes[i] || ''}
                          onChange={e => updateNote(i, e.target.value)}
                          className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-white/30"
                        />
                      </div>
                      <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white text-xs mt-1">remove</button>
                    </motion.div>
                  ))}
                </div>
              )}

              <input
                type="text"
                placeholder="shared caption (used when a file has no own note)"
                value={sharedCaption}
                onChange={e => setSharedCaption(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/30"
              />

              <div className="flex gap-4 items-center">
                <label className="text-sm text-neutral-400">accent</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-8 rounded-lg bg-transparent border-0" />
              </div>

              <button
                onClick={publish}
                disabled={status === 'uploading' || !files.length}
                className="w-full rounded-2xl bg-white text-black font-medium py-3 disabled:opacity-40 transition hover:scale-[1.015] active:scale-[0.985]"
              >
                {status === 'uploading' ? 'folding the light…' : 'publish from the lumenfold'}
              </button>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    {results.map(r => (
                      <div key={r.id} className="bg-white/5 rounded-2xl p-3 text-sm">
                        <div className="font-medium truncate">{r.name}</div>
                        <a href={r.embed} className="text-blue-400 truncate block text-xs" target="_blank" rel="noreferrer">{r.embed}</a>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <h2 className="text-sm font-medium text-neutral-400 mb-3">recent folds</h2>
              <div className="space-y-3">
                {recent.map(item => (
                  <motion.a
                    key={item.id}
                    href={`/s/${item.id}`}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="block bg-white/5 hover:bg-white/10 rounded-2xl p-3 transition text-sm"
                  >
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{item.caption || 'shared quietly'}</div>
                  </motion.a>
                ))}
                {recent.length === 0 && <div className="text-neutral-500 text-xs">nothing yet</div>}
              </div>
              <button onClick={() => navigate('home')} className="mt-6 text-xs text-neutral-400 hover:text-white">back to desks →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
