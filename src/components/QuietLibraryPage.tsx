import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function formatBytes(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function QuietLibraryPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'other'>('all');
  const [dropNote, setDropNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [pending, setPending] = useState<{ file: File; id: string; preview?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listPublicShares(48);
    setShares(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    return shares.filter((s) => {
      const q = query.toLowerCase();
      const matchesQuery = !q || (s.name || '').toLowerCase().includes(q) || (s.caption || '').toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (filter === 'all') return true;
      const type = (s.type || '').toLowerCase();
      if (filter === 'image') return type.startsWith('image/');
      if (filter === 'video') return type.startsWith('video/');
      if (filter === 'audio') return type.startsWith('audio/');
      return !type.startsWith('image/') && !type.startsWith('video/') && !type.startsWith('audio/');
    });
  }, [shares, query, filter]);

  const onDrop = useCallback((files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    setWarn(file.size > 40 * 1024 * 1024 ? 'Large file — may feel slower while sending. No hard limits.' : null);
    setPending({
      file,
      id: Math.random().toString(36).slice(2, 10),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    });
  }, []);

  const publish = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const res = await publishLocalFile(pending.file, {
        caption: dropNote.trim() || pending.file.name,
        color: accent,
        cardTitle: pending.file.name,
        meta: { desk: 'quietlibrary' },
      });
      if (res.ok) {
        setPending(null);
        setDropNote('');
        setWarn(null);
        await refresh();
      } else {
        setWarn(res.error || 'Could not publish');
      }
    } catch (e: any) {
      setWarn(e.message || 'Upload failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Quiet Library</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">Browse the quiet collection.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-2xl">
            A calm visual explorer of every public share. Search, filter, and drop a local file to add it with a note. Soft size warnings only. Every link carries a polished Discord embed.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names or notes…"
            className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
          />
          <div className="flex flex-wrap gap-2">
            {(['all', 'image', 'video', 'audio', 'other'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-2xl text-sm transition ${
                  filter === f ? 'bg-white/15 text-white' : 'bg-black/20 text-neutral-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#0A84FF]/40'); }}
          onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40')}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40');
            if (e.dataTransfer.files.length) onDrop(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-white/12 rounded-3xl p-10 text-center mb-10 cursor-pointer hover:border-white/25 transition bg-black/15"
        >
          <p className="text-neutral-300 text-[15px]">Drop a file to add to the library</p>
          <p className="text-neutral-500 text-sm mt-1">or click to choose · soft warnings only</p>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files && onDrop(e.target.files)} />
        </div>

        <AnimatePresence>
          {pending && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="glass rounded-3xl p-6 mb-10"
            >
              <div className="flex items-center gap-4 mb-4">
                {pending.preview ? (
                  <img src={pending.preview} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500">file</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{pending.file.name}</p>
                  <p className="text-xs text-neutral-500">{formatBytes(pending.file.size)}</p>
                </div>
                <button onClick={() => setPending(null)} className="text-xs text-neutral-500 hover:text-white">clear</button>
              </div>
              <input
                value={dropNote}
                onChange={(e) => setDropNote(e.target.value)}
                placeholder="Optional note for this share"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30"
              />
              <div className="flex items-center gap-3 mb-5">
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0" />
                <span className="text-[13px] text-neutral-500">Accent</span>
              </div>
              {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={publish}
                disabled={busy}
                className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
                style={{ background: accent }}
              >
                {busy ? 'Adding…' : 'Add to library'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <p className="text-neutral-500 text-sm text-center py-12">opening the library…</p>
        ) : filtered.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-12">nothing matches. drop something new.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((share, i) => (
              <motion.button
                key={share.id}
                onClick={() => navigate('share', share.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4), type: 'spring', stiffness: 160, damping: 22 }}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                className="glass rounded-3xl p-4 text-left hover:bg-white/[0.06] transition overflow-hidden"
              >
                {share.type?.startsWith('image/') && share.url ? (
                  <img src={share.url} alt="" className="w-full h-40 object-cover rounded-2xl mb-3" />
                ) : (
                  <div className="w-full h-40 rounded-2xl bg-white/5 grid place-items-center text-xs text-neutral-500 mb-3">
                    {share.type?.split('/')[0] || 'file'}
                  </div>
                )}
                <p className="text-sm font-medium truncate">{share.name}</p>
                <p className="text-xs text-neutral-500 truncate mt-1">{share.caption || 'shared quietly'} · {formatBytes(share.size)}</p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
