import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftlumenatlasPage() {
  const [shares, setShares] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(48).then(setShares).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return shares.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.caption || '').toLowerCase().includes(q)
    );
  }, [shares, query]);

  const onDrop = (list: FileList | null) => {
    if (!list?.length) return;
    const arr = Array.from(list);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'large drop. the browser may feel slow while it sends. no hard limit.' : '');
    setErr('');
  };

  const publish = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, { caption: note || 'atlas entry', color, cardTitle: file.name });
        if (!res.ok) setErr(res.error || 'failed');
        else if (res.warn) setWarn(res.warn);
      }
      const fresh = await listPublicShares(48);
      setShares(fresh);
      setFiles([]);
      setNote('');
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 mb-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color }}>softlumenatlas</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet atlas of what has been shared.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">
            Search recent public drops. Add new ones with a shared note and accent. Soft light drifts across the glass. Every link carries a polished Discord embed. Large files warned, never refused. All prior desks remain fully intact.
          </p>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="search names or notes…"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 mb-4"
          />
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="shared note for new drops"
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/20"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500">accent</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            </div>
          </div>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-white/30 p-8 text-center transition mb-4"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={e => onDrop(e.target.files)} />
            <p className="text-white font-medium">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to chart` : 'drop files to add to the atlas'}</p>
            <p className="text-xs text-neutral-500 mt-1">no hard limits — only gentle warnings</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-2">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-2">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={busy || !files.length}
            onClick={publish}
            className="w-full py-3 rounded-full text-sm font-medium disabled:opacity-40"
            style={{ background: color, color: '#000' }}
          >
            {busy ? 'charting…' : 'add to atlas'}
          </motion.button>
        </motion.div>
        {loading ? (
          <div className="text-center text-neutral-500 text-sm">mapping…</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s, i) => (
              <motion.a
                key={s.id}
                href={shareUrls(s.id).app}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 18 }}
                className="glass rounded-3xl p-5 block hover:bg-white/[0.07] transition-all duration-500"
              >
                <p className="text-xs text-neutral-500 mb-1 truncate">{s.name || 'untitled'}</p>
                <p className="text-sm text-neutral-300 line-clamp-2 mb-3">{s.caption || 'shared quietly'}</p>
                <p className="text-[11px] text-neutral-600">{(s.size / 1024 / 1024).toFixed(1)} MB · {s.downloads || 0} arrivals</p>
              </motion.a>
            ))}
            {!filtered.length && <p className="text-neutral-500 text-sm col-span-full text-center">nothing matches yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
