import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function QuietStillwaterPage() {
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
        meta: { desk: 'quietstillwater' },
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
          transition={{ duration: 1.6 }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[140px]" style={{ background: `${color}10` }} />
          <div className="absolute left-1/4 bottom-1/3 w-64 h-64 rounded-full blur-[80px] bg-white/4" />
        </motion.div>

        <div className="max-w-5xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 70, damping: 22 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3"
          >
            quiet stillwater
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="text-neutral-400 mb-10 max-w-2xl text-lg leading-relaxed"
          >
            A still surface for what you carry. Drop local files. They settle as gentle floating glass with subtle ripple spring motion on frosted glass. Shared caption, cool accent. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                className="block rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.03] backdrop-blur-md p-10 text-center cursor-pointer hover:border-white/30 hover:bg-white/[0.05] transition-all duration-300"
              >
                <input type="file" multiple className="hidden" onChange={e => e.target.files && onFiles(e.target.files)} />
                <div className="text-base font-medium mb-1">drop files onto the stillwater</div>
                <div className="text-xs text-neutral-500">or click to browse · soft size warnings only</div>
                {warn && <div className="mt-3 text-amber-300/90 text-xs">{warn}</div>}
              </label>

              {files.length > 0 && (
                <div className="mt-5 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-2.5 text-sm border border-white/5">
                      <span className="truncate pr-4">{f.name}</span>
                      <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white text-xs shrink-0">remove</button>
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/25 focus:bg-white/[0.07] transition"
                />
                <div className="flex gap-4 items-center">
                  <label className="text-sm text-neutral-400">stillwater accent</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border-0 cursor-pointer" />
                </div>
                <motion.button
                  onClick={publish}
                  disabled={!files.length || status === 'uploading'}
                  whileTap={{ scale: 0.985 }}
                  className="w-full rounded-2xl bg-white text-black font-medium py-3.5 disabled:opacity-40 transition hover:bg-neutral-100"
                >
                  {status === 'uploading' ? 'settling on the surface…' : 'publish to stillwater'}
                </motion.button>
              </div>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-white/5 backdrop-blur-md rounded-2xl p-5 space-y-3 border border-white/10"
                  >
                    <div className="font-medium text-sm">shared from the stillwater</div>
                    {results.map(r => (
                      <a key={r.id} href={r.embed} className="block text-sm text-blue-400 truncate hover:text-blue-300" target="_blank" rel="noreferrer">
                        {r.name}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-5 text-neutral-200">settling glass</h2>
              <div className="relative min-h-[300px]">
                <AnimatePresence>
                  {files.map((f, i) => (
                    <motion.div
                      key={f.name + i + f.size}
                      initial={{ opacity: 0, y: 30, scale: 0.92 }}
                      animate={{
                        opacity: 1,
                        y: [0, -4, 0],
                        scale: 1,
                      }}
                      exit={{ opacity: 0, scale: 0.95, y: -12 }}
                      transition={{
                        type: 'spring',
                        stiffness: 90,
                        damping: 18,
                        delay: i * 0.05,
                        y: { duration: 4 + i * 0.4, repeat: Infinity, ease: 'easeInOut' },
                      }}
                      className="absolute left-0 right-0 bg-white/[0.05] backdrop-blur-xl rounded-3xl p-5 border border-white/10"
                      style={{
                        top: `${16 + i * 68}px`,
                        boxShadow: `0 6px 32px ${color}18, 0 0 0 1px ${color}0c`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full" style={{ background: `${color}28`, boxShadow: `0 0 16px ${color}30` }} />
                        <div>
                          <div className="text-sm font-medium truncate max-w-[220px]">{f.name}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">{(f.size / 1024 / 1024).toFixed(1)} MB</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {files.length === 0 && (
                  <div className="text-neutral-500 text-sm absolute inset-0 flex items-center justify-center">
                    files will float here with gentle ripples…
                  </div>
                )}
              </div>

              <h2 className="text-lg font-medium mt-12 mb-4 text-neutral-200">recent on the surface</h2>
              <div className="space-y-3">
                {recent.map(item => (
                  <motion.a
                    key={item.id}
                    href={`/s/${item.id}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.015, x: 3 }}
                    className="block bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition border border-white/5"
                  >
                    <div className="font-medium truncate text-sm">{item.name}</div>
                    <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.caption || 'shared from rankvault'}</div>
                  </motion.a>
                ))}
                {recent.length === 0 && <div className="text-neutral-500 text-sm">no public shares yet</div>}
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={() => navigate('directory')}
              className="text-sm text-neutral-400 hover:text-white transition"
            >
              browse all desks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
