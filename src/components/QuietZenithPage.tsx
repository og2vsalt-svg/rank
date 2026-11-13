import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function QuietZenithPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5AC8FA');
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
    setWarn(large ? 'large file detected. the browser may feel slow while uploading. no hard limit.' : null);
    setFiles(prev => [...prev, ...arr]);
    setStatus('idle');
  }, []);

  const remove = (idx: number) => setFiles(f => f.filter((_, i) => i !== idx));

  const publish = async () => {
    if (!files.length) return;
    setStatus('uploading');
    const out: { id: string; embed: string; name: string }[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || file.name,
        color,
        cardTitle: file.name.replace(/\.[^.]+$/, ''),
        author: 'rankvault',
        meta: { desk: 'quietzenith' },
      });
      if (res.ok && res.id) {
        out.push({ id: res.id, embed: shareUrls(res.id).embed, name: file.name });
      }
    }
    setResults(out);
    setFiles([]);
    setCaption('');
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
          <div className="absolute left-1/2 top-1/4 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-3xl" style={{ background: `${color}14` }} />
        </motion.div>

        <div className="max-w-5xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            className="text-4xl font-semibold tracking-tight mb-2"
          >
            quiet zenith
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-neutral-400 mb-8 max-w-2xl"
          >
            Ascend what you carry. Drop local files and watch them rise as soft floating glass orbs with upward spring motion on frosted glass. Shared caption and cool accent. Publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact.
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
                <div className="text-xs text-neutral-500 mt-1">multiple welcome · soft size warnings only</div>
                {warn && <div className="mt-2 text-amber-300 text-xs">{warn}</div>}
              </label>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-2 text-sm">
                      <span className="truncate">{f.name}</span>
                      <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white text-xs">remove</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="shared caption (optional)"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/30"
                />
                <div className="flex gap-4 items-center">
                  <label className="text-sm text-neutral-400">zenith accent</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border-0" />
                </div>
                <button
                  onClick={publish}
                  disabled={!files.length || status === 'uploading'}
                  className="w-full rounded-2xl bg-white text-black font-medium py-3 disabled:opacity-40 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {status === 'uploading' ? 'ascending into the zenith…' : 'publish to zenith'}
                </button>
              </div>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white/5 rounded-2xl p-4 space-y-2">
                    <div className="font-medium">shared</div>
                    {results.map(r => (
                      <a key={r.id} href={r.embed} className="block text-sm text-blue-400 truncate" target="_blank" rel="noreferrer">{r.name} — {r.embed}</a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4">ascending orbs</h2>
              <div className="relative min-h-[280px]">
                <AnimatePresence>
                  {files.map((f, i) => (
                    <motion.div
                      key={f.name + i}
                      initial={{ opacity: 0, y: 60, scale: 0.9 }}
                      animate={{ opacity: 1, y: -20 - i * 12, scale: 1 }}
                      exit={{ opacity: 0, y: -40, scale: 0.85 }}
                      transition={{ type: 'spring', stiffness: 110, damping: 16, delay: i * 0.05 }}
                      className="absolute left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-md rounded-full px-5 py-3 border border-white/10 text-sm"
                      style={{ boxShadow: `0 0 40px ${color}28`, top: `${20 + i * 18}%` }}
                    >
                      <div className="font-medium truncate max-w-[180px]">{f.name}</div>
                      <div className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {files.length === 0 && <div className="text-neutral-500 text-sm absolute inset-0 grid place-items-center">files will rise here…</div>}
              </div>

              <h2 className="text-lg font-medium mt-8 mb-4">recent shares</h2>
              <div className="space-y-3">
                {recent.map(item => (
                  <motion.a
                    key={item.id}
                    href={`/s/${item.id}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.015 }}
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
