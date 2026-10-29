import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function LumenLedgerPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#34C759');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    const list = await listPublicShares(36);
    setShares(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 12));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. the send may feel slow. no hard limit.' : '');
  };

  const publish = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setErr('');
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: 'lumen ledger entry',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'lumenledger' },
        });
        if (!res.ok) {
          setErr(res.error || `failed on ${file.name}`);
          break;
        }
        if (res.warn) setWarn(res.warn);
      }
      setFiles([]);
      await load();
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18 }} className="mb-8">
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>lumenledger</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet ledger of shared light.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Browse the public record or drop local files into the ledger. Each lands in storage and the public_shares table. Share links unfurl with polished Discord cards. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact.
          </p>
        </motion.div>

        <div className="glass rounded-[28px] p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
          </div>
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#34C759]/40 p-6 text-center transition mb-4" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">drop or click to add to the ledger</p>
          </label>
          {files.length > 0 && <p className="text-xs text-neutral-400 mb-3">{files.length} file(s) ready</p>}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={publish} disabled={busy || files.length === 0} className="px-5 py-2.5 rounded-full text-white text-sm font-medium disabled:opacity-50" style={{ background: accent }}>
            {busy ? 'filing…' : 'add to ledger'}
          </motion.button>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500 text-center">opening ledger…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shares.map((s) => (
              <motion.a key={s.id} href={shareUrls(s.id).app} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition">
                <p className="text-sm font-medium truncate">{s.name || s.id}</p>
                <p className="text-xs text-neutral-500 mt-1 truncate">{s.caption || s.type}</p>
                <p className="text-xs text-neutral-600 mt-2">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</p>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
