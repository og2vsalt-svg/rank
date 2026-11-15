import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function QuietStreamPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<{ file: File; id: string; preview?: string; status: string; link?: string }[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listPublicShares(36);
    setShares(list);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 40_000_000 ? 'Large drop into the stream. May feel slower. No hard limits.' : null);
    const newItems = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'queued',
    }));
    setItems((prev) => [...newItems, ...prev]);
  }, []);

  const publish = async () => {
    if (!items.length) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const res = await publishLocalFile(item.file, {
          caption: caption || item.file.name,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'quietstream' },
        });
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: res.ok ? 'done' : 'error', link: res.embed } : i));
      } catch {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'error' } : i));
      }
    }
    setBusy(false);
    setTimeout(load, 800);
  };

  const filtered = shares.filter((s) => {
    if (filter === 'image' && !s.type.startsWith('image/')) return false;
    if (filter === 'text' && !s.type.startsWith('text/')) return false;
    if (q && !s.name.toLowerCase().includes(q.toLowerCase()) && !(s.caption || '').toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 22 }} className="mb-10">
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Stream</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">A living stream of shares.</h1>
          <p className="text-neutral-400 text-base leading-relaxed max-w-2xl">
            Recent public drops flow through a quiet stream. Search, filter, and drop new local files straight into the current. They publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. Spring-animated frosted glass cards. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div className="glass rounded-3xl p-6 mb-8">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files); }}
            className="border border-dashed border-white/15 rounded-2xl p-8 text-center mb-4"
          >
            <label className="inline-block px-5 py-2 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer text-sm">
              drop files into the stream
              <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
            </label>
          </div>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption for new drops" className="w-full bg-black/20 rounded-2xl px-4 py-3 text-sm mb-4 outline-none" />
          <div className="flex items-center gap-3 mb-4">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full" />
            <span className="text-xs text-neutral-500">accent</span>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {items.length > 0 && (
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  {item.preview && <img src={item.preview} className="w-10 h-10 rounded-lg object-cover" />}
                  <span className="flex-1 truncate">{item.file.name}</span>
                  <span className="text-xs text-neutral-500">{item.status}</span>
                  {item.link && <a href={item.link} className="text-xs text-blue-400">link</a>}
                </div>
              ))}
            </div>
          )}
          <button onClick={publish} disabled={busy || !items.length} className="px-5 py-2 rounded-full text-sm font-medium text-black disabled:opacity-40" style={{ background: accent }}>
            {busy ? 'Publishing…' : 'Publish to stream'}
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {['all', 'image', 'text'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs ${filter === f ? 'bg-white text-black' : 'bg-white/5'}`}>{f}</button>
          ))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search stream…" className="flex-1 bg-white/5 rounded-full px-4 py-1 text-sm outline-none" />
        </div>

        {loading ? (
          <p className="text-neutral-500 text-sm">loading stream…</p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((s, i) => (
                <motion.a
                  key={s.id}
                  href={shareUrls(s.id).embed}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 110, damping: 20 }}
                  className="glass rounded-2xl p-4 flex gap-4 hover:bg-white/5 transition block"
                >
                  {s.type.startsWith('image/') && s.url ? (
                    <img src={s.url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500">file</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{formatBytes(s.size)} · {s.caption || 'shared'}</p>
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
            {!filtered.length && <p className="text-neutral-500 text-sm">quiet for now. drop something above.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
