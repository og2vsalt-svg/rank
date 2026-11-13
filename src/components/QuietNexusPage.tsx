import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function QuietNexusPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; embed: string; name: string }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(8).then(setRecent).catch(() => {});
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
        meta: { desk: 'quietnexus' },
      });
      if (res.ok && res.id) {
        out.push({ id: res.id, embed: shareUrls(res.id).embed, name: file.name });
      }
    }
    setResults(out);
    setFiles([]);
    setCaption('');
    listPublicShares(8).then(setRecent).catch(() => {});
    setStatus('done');
  };

  const quickDesks = [
    { to: 'quietmirage', label: 'mirage' },
    { to: 'quietvellum', label: 'vellum' },
    { to: 'quietforge', label: 'forge' },
    { to: 'quietshelf', label: 'shelf' },
    { to: 'directshare', label: 'direct share' },
    { to: 'directory', label: 'all desks' },
  ];

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="min-h-screen bg-transparent text-white pt-24 px-5 pb-16 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: `${color}18` }} />
        </motion.div>

        <div className="max-w-5xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 22 }}
            className="text-4xl font-semibold tracking-tight mb-2"
          >
            quiet nexus
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="text-neutral-400 mb-8 max-w-2xl"
          >
            A calm central hub. Drop local files here and they settle into the database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style spring motion on frosted glass. Navigate to any specialized desk. All prior features remain fully intact.
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
                  <label className="text-sm text-neutral-400">nexus accent</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border-0" />
                </div>
                <button
                  onClick={publish}
                  disabled={!files.length || status === 'uploading'}
                  className="w-full rounded-2xl bg-white text-black font-medium py-3 disabled:opacity-40 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {status === 'uploading' ? 'settling into the nexus…' : 'publish to nexus'}
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

              <div className="mt-8">
                <h2 className="text-sm font-medium text-neutral-400 mb-3">quick desks</h2>
                <div className="flex flex-wrap gap-2">
                  {quickDesks.map(d => (
                    <button
                      key={d.to}
                      onClick={() => navigate(d.to)}
                      className="px-4 py-1.5 rounded-full bg-white/5 text-sm hover:bg-white/10 transition"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4">live nexus</h2>
              <div className="space-y-3 min-h-[180px]">
                <AnimatePresence>
                  {files.map((f, i) => (
                    <motion.div
                      key={f.name + i}
                      initial={{ opacity: 0, y: 14, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 130, damping: 18, delay: i * 0.04 }}
                      className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10"
                      style={{ boxShadow: `0 0 36px ${color}22` }}
                    >
                      <div className="text-sm font-medium truncate">{f.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">{(f.size / 1024 / 1024).toFixed(1)} MB</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {files.length === 0 && <div className="text-neutral-500 text-sm">files will settle here…</div>}
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
