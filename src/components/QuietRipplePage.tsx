import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';

type RippleFile = { id: string; file: File; preview?: string; caption: string };

export default function QuietRipplePage() {
  const [files, setFiles] = useState<RippleFile[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [color, setColor] = useState('#64D2FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; embed: string; name: string }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(6).then(setRecent).catch(() => {});
  }, []);

  const onFiles = useCallback((list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (!incoming.length) return;
    const large = incoming.some(f => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'large file detected. the browser may feel slow while uploading. no hard limit.' : null);
    const next: RippleFile[] = incoming.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      caption: '',
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setFiles(prev => [...prev, ...next]);
    setStatus('idle');
  }, []);

  const updateCaption = (id: string, caption: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, caption } : f));
  };

  const remove = (id: string) => {
    setFiles(prev => {
      const f = prev.find(x => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter(x => x.id !== id);
    });
  };

  const publishAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    const out: { id: string; embed: string; name: string }[] = [];
    for (const item of files) {
      const res = await publishLocalFile(item.file, {
        caption: item.caption || sharedCaption || item.file.name,
        color,
        cardTitle: item.file.name,
        author: 'rankvault',
        meta: { desk: 'quietripple', sharedCaption },
      });
      if (res.ok && res.id) {
        out.push({ id: res.id, embed: shareUrls(res.id).embed, name: item.file.name });
      }
    }
    setResults(out);
    setFiles([]);
    setSharedCaption('');
    listPublicShares(6).then(setRecent).catch(() => {});
    setStatus('done');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="min-h-screen bg-transparent text-white pt-24 px-5 pb-16 relative overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none border border-white/10"
            style={{
              width: 40 + i * 18,
              height: 40 + i * 18,
              left: `${5 + (i * 13) % 85}%`,
              top: `${10 + (i * 11) % 70}%`,
              opacity: 0.15,
            }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{ duration: 4 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          />
        ))}

        <div className="max-w-5xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="text-4xl font-semibold tracking-tight mb-2"
          >
            quiet ripple
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 mb-8 max-w-2xl"
          >
            Drop local files into a soft ripple. They settle as expanding glass cards with spring motion. Shared or per-file captions, cool accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                className="block rounded-3xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center cursor-pointer hover:border-white/40 transition"
              >
                <input type="file" multiple className="hidden" onChange={e => e.target.files && onFiles(e.target.files)} />
                <div className="text-sm font-medium">drop files or click to browse</div>
                <div className="text-xs text-neutral-500 mt-1">multi-file · soft size warnings only</div>
                {warn && <div className="mt-2 text-amber-300 text-xs">{warn}</div>}
              </label>

              <div className="mt-6 space-y-3">
                <AnimatePresence>
                  {files.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                      className="bg-white/5 rounded-2xl p-4 flex gap-4 items-start"
                    >
                      {item.preview && <img src={item.preview} alt="" className="w-16 h-16 rounded-xl object-cover" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.file.name}</div>
                        <input
                          type="text"
                          placeholder="caption (optional)"
                          value={item.caption}
                          onChange={e => updateCaption(item.id, e.target.value)}
                          className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs outline-none"
                        />
                      </div>
                      <button onClick={() => remove(item.id)} className="text-neutral-500 hover:text-white text-xs">remove</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="shared caption for all (optional)"
                  value={sharedCaption}
                  onChange={e => setSharedCaption(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/30"
                />
                <div className="flex gap-4 items-center">
                  <label className="text-sm text-neutral-400">ripple accent</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border-0" />
                </div>
                <button
                  onClick={publishAll}
                  disabled={!files.length || status === 'uploading'}
                  className="w-full rounded-2xl bg-white text-black font-medium py-3 disabled:opacity-40 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {status === 'uploading' ? 'sending ripples…' : `publish ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
                </button>
              </div>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                    <div className="font-medium">shared</div>
                    {results.map(r => (
                      <a key={r.id} href={r.embed} className="block text-sm text-blue-400 truncate" target="_blank" rel="noreferrer">{r.name} — {r.embed}</a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4">live public ripples</h2>
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
                {recent.length === 0 && <div className="text-neutral-500 text-sm">no public shares yet</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
