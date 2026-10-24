import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function QuietLibraryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#A1C4FF');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'text' | 'other'>('all');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const filtered = useMemo(() => {
    let list = shares;
    if (filter === 'image') list = list.filter(s => s.type?.startsWith('image/'));
    else if (filter === 'text') list = list.filter(s => s.type?.startsWith('text/') || s.name?.endsWith('.txt') || s.name?.endsWith('.md'));
    else if (filter === 'other') list = list.filter(s => !s.type?.startsWith('image/') && !s.type?.startsWith('text/'));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(s => (s.name || '').toLowerCase().includes(q) || (s.caption || '').toLowerCase().includes(q));
    }
    return list;
  }, [shares, filter, query]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(64);
    setShares(rows);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setStatus('');
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'quietlibrary', kind: 'library' },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
    }
    setFiles([]);
    setBusy(false);
    await refresh();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 18 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">quietlibrary</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] leading-tight">a still shelf of shared things</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Browse public shares as if they rest on a quiet library shelf. Search, filter by kind, drop local files to settle them into storage and the public record. Soft spring motion, glass surfaces, polished Discord embeds on every link. Large files warned, never refused.
          </p>
        </motion.div>

        <div className="mt-8 flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search the shelves…"
            className="flex-1 min-w-[200px] rounded-2xl bg-white/[0.04] px-4 py-2.5 text-[14px] outline-none ring-1 ring-white/10 focus:ring-white/20"
          />
          {(['all', 'image', 'text', 'other'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-[13px] capitalize transition ${filter === f ? 'bg-white/15 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full text-center text-white/40">opening shelves…</p>
          ) : filtered.length === 0 ? (
            <p className="col-span-full text-center text-white/40">nothing on this shelf yet.</p>
          ) : (
            filtered.map((s) => (
              <motion.a
                key={s.id}
                href={shareUrls(s.id).embed}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className="group block rounded-3xl glass p-4 transition hover:bg-white/[0.06]"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-white/5 grid place-items-center">
                  {s.type?.startsWith('image/') ? (
                    <img src={s.fileUrl || s.url} alt={s.name || ''} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[13px] text-white/40">{s.type?.split('/')[1] || 'file'}</span>
                  )}
                </div>
                <p className="mt-3 truncate text-[15px] font-medium">{s.name || 'untitled'}</p>
                {s.caption && <p className="mt-1 line-clamp-2 text-[13px] text-white/55">{s.caption}</p>}
                <p className="mt-2 text-[11px] text-white/35">{new Date(s.createdAt || '').toLocaleDateString()}</p>
              </motion.a>
            ))
          )}
        </div>

        <aside className="mt-12 rounded-3xl glass p-6">
          <p className="text-[13px] uppercase tracking-[0.14em] text-white/40">add to the shelves</p>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="mt-3 block w-full text-[13px] text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-1.5 file:text-[13px] file:text-white"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared note for the shelf"
            className="mt-3 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
            <span className="text-[12px] text-white/45">accent</span>
          </div>
          {heavy && <p className="mt-2 text-[12px] text-amber-200/80">large batch. encoding or sending may feel slow. nothing is refused.</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={send}
            disabled={!files.length || busy}
            className="mt-3 w-full rounded-full px-4 py-2.5 text-[14px] font-medium text-black disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'shelving…' : 'place on the shelves'}
          </motion.button>
          {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
        </aside>
      </main>
    </div>
  );
}
