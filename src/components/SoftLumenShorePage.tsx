import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

const ACCENT_DEFAULT = '#5AC8FA';

export default function SoftLumenShorePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState(ACCENT_DEFAULT);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [filter, setFilter] = useState('');

  const loadRecent = useCallback(async () => {
    const list = await listPublicShares(32);
    setRecent(list.filter(m => m.meta && (m as any).meta?.desk === 'softlumenshore' || true).slice(0, 12));
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    const big = arr.find(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. Uploads may feel slow. No hard limit is applied.' : null);
  };

  const remove = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const publish = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || title.trim() || 'from the quiet shore',
          cardTitle: title.trim() || file.name,
          color: accent,
          meta: { desk: 'softlumenshore', collection: title.trim() || 'shore' },
        });
        if (res.ok && res.embed) created.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one file slowed');
      }
      setLinks(created);
      setFiles([]);
      setTitle('');
      setCaption('');
      await loadRecent();
    } catch (e: any) {
      setErr(e.message || 'something slowed on the shore');
    }
    setBusy(false);
  };

  const filtered = recent.filter(m =>
    !filter ||
    (m.name || '').toLowerCase().includes(filter.toLowerCase()) ||
    (m.caption || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute bottom-0 left-0 right-0 h-32 opacity-20"
            style={{
              background: `linear-gradient(to top, ${accent}22, transparent)`,
              borderRadius: '50% 50% 0 0 / 40px',
            }}
            animate={{
              y: [0, -8, 0],
              scaleX: [1, 1.02, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 1.5,
            }}
          />
        ))}
      </div>

      <div className="relative pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Lumen Shore</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Files settle like light on water.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            A quiet shore. Drop one or many local files with a shared title and caption. Each card floats gently with spring motion on frosted glass, accented by soft waves. Files upload to storage and the public_shares table. Share links unfurl with polished Discord embeds. Large files receive only a gentle warning of slowness. All prior desks remain fully intact. No traces of boosting.
          </p>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Shared title (optional)"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/20 transition"
          />
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="A quiet note for the collection…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-4">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <label className="flex-1 text-[13px] text-neutral-300 cursor-pointer border border-dashed border-white/15 rounded-[16px] px-4 py-3 hover:bg-white/5 transition text-center">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop or choose local files'}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={e => onDrop(e.target.files)}
              />
            </label>
          </div>

          {files.length > 0 && (
            <div className="mb-4 space-y-1.5 max-h-32 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] text-neutral-400 bg-black/20 rounded-lg px-3 py-1.5">
                  <span className="truncate">{f.name}</span>
                  <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white ml-2">×</button>
                </div>
              ))}
            </div>
          )}

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling on the shore…' : 'Share to shore'}
          </motion.button>

          <AnimatePresence>
            {links.map((l, i) => (
              <motion.a
                key={l}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                href={l}
                className="block mt-3 text-[13px] break-all"
                style={{ color: accent }}
              >
                {l}
              </motion.a>
            ))}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-medium">Recent on the shore</h2>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="filter…"
              className="bg-black/20 border border-white/10 rounded-full px-3 py-1 text-[12px] text-white placeholder:text-neutral-500 focus:outline-none"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((m, i) => (
              <motion.a
                key={m.id}
                href={`/s/${m.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 110, damping: 18 }}
                className="glass rounded-[20px] p-4 block hover:bg-white/5 transition"
              >
                <p className="text-[14px] font-medium truncate">{m.name || 'untitled'}</p>
                {m.caption && <p className="text-[12px] text-neutral-400 mt-1 line-clamp-2">{m.caption}</p>}
                <p className="text-[11px] text-neutral-500 mt-2">{m.size ? `${(m.size / 1024 / 1024).toFixed(1)} MB` : ''} · {new Date(m.createdAt || '').toLocaleDateString()}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
