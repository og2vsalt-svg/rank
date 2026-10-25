import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares } from '../lib/cloudShare';

type Share = {
  id: string;
  name: string;
  caption?: string | null;
  size: number;
  createdAt?: string;
  downloads?: number;
};

export default function SoftLedgerPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const load = async () => {
    const list = await listPublicShares(40);
    setShares(list.map(s => ({
      id: s.id,
      name: s.name || 'untitled',
      caption: s.caption,
      size: s.size || 0,
      createdAt: s.createdAt,
      downloads: s.downloads || 0,
    })));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return shares.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.caption || '').toLowerCase().includes(q)
    );
  }, [shares, query]);

  const totalSize = useMemo(() => shares.reduce((a, s) => a + s.size, 0), [shares]);
  const totalDownloads = useMemo(() => shares.reduce((a, s) => a + (s.downloads || 0), 0), [shares]);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    setWarn(arr.some(f => f.size > 40 * 1024 * 1024) ? 'Large files present. Upload may feel slow. No hard limit.' : null);
  };

  const settle = async () => {
    if (!files.length) return setErr('choose files to enter the ledger');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const f of files) {
        const res = await publishLocalFile(f, {
          caption: note.trim() || undefined,
          color: accent,
          cardTitle: f.name,
          meta: { desk: 'softledger' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'entry failed');
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      await load();
    } catch (e: any) {
      setErr(e.message || 'ledger paused');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-28 pb-24 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide" style={{ color: accent }}>Soft Ledger</p>
          <h1 className="text-[36px] font-semibold tracking-tight mt-1">A quiet record of what has been set down.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mt-3 max-w-2xl">
            Browse the public ledger of shares. Totals, search, recent entries. Drop local files to add new lines. Each lands in storage and the public_shares table with a professional Discord embed. Soft spring animations, frosted glass. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'entries', value: shares.length },
            { label: 'total size', value: `${(totalSize / 1024 / 1024).toFixed(1)} MB` },
            { label: 'downloads', value: totalDownloads },
            { label: 'filtered', value: filtered.length },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 140, damping: 18 }}
              className="glass rounded-[22px] p-5"
            >
              <p className="text-[12px] text-neutral-500 uppercase tracking-wide">{stat.label}</p>
              <p className="text-[22px] font-semibold mt-1" style={{ color: accent }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="glass rounded-[28px] p-6 mb-8">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the ledger…"
            className="w-full bg-transparent border-0 text-[15px] text-white placeholder:text-neutral-500 outline-none mb-4"
          />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="flex items-center justify-between rounded-[16px] px-4 py-3 hover:bg-white/5 transition"
              >
                <div className="min-w-0">
                  <p className="text-[14px] text-white truncate">{s.name}</p>
                  {s.caption && <p className="text-[12px] text-neutral-400 truncate">{s.caption}</p>}
                </div>
                <div className="text-right text-[12px] text-neutral-500 shrink-0 ml-4">
                  <div>{(s.size / 1024).toFixed(0)} kb</div>
                  <div>{s.downloads} opens</div>
                </div>
              </motion.a>
            ))}
            {filtered.length === 0 && <p className="text-neutral-500 text-[13px] py-6 text-center">nothing matches</p>}
          </div>
        </div>

        <div className="glass rounded-[28px] p-6">
          <p className="text-[14px] font-medium mb-4">Add to the ledger</p>
          <label className="block border border-dashed border-white/15 rounded-[20px] p-6 text-center mb-4 cursor-pointer hover:border-white/25 transition">
            {files.length ? `${files.length} files ready` : 'Drop or choose local files'}
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for these entries"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-2 text-[14px] text-white placeholder:text-neutral-500 mb-3 resize-none outline-none"
          />
          <div className="flex items-center gap-3 mb-4">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-8 h-8 rounded-full border-0 cursor-pointer" />
            <span className="text-[13px] text-neutral-400">accent</span>
          </div>
          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={settle}
            disabled={busy || !files.length}
            className="w-full rounded-[16px] py-3 text-[14px] font-medium text-white disabled:opacity-40"
            style={{ background: accent }}
          >
            {busy ? 'Entering…' : 'Add to ledger'}
          </motion.button>
          {links.length > 0 && (
            <div className="mt-4 space-y-1">
              {links.map(l => <a key={l} href={l} className="block text-[12px] break-all" style={{ color: accent }}>{l}</a>)}
            </div>
          )}
          {err && <p className="mt-3 text-[12px] text-red-400">{err}</p>}
        </div>
      </div>
    </div>
  );
}
