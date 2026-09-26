import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

type Row = { name: string; size: number; embed: string; app: string; warn?: string };

function pretty(n: number) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} mb`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} gb`;
}

export default function QuayPage() {
  const { addFiles, togglePublic } = useVault();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    setErr('');
    setBusy(true);
    const next: Row[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setProgress(`docking ${i + 1} / ${files.length} · ${f.name}`);
        const warn =
          f.size > 40 * 1024 * 1024
            ? 'chunky. no cap, but this tab might hitch while it encodes.'
            : undefined;
        const result = await addFiles([f], 'quay');
        if (!result.ok || !result.ids?.[0]) {
          setErr(result.error || `could not save ${f.name}`);
          continue;
        }
        const id = result.ids[0];
        const pub = await togglePublic(id);
        if (!pub.ok) {
          setErr(pub.error || `saved ${f.name} locally, cloud miss`);
          continue;
        }
        const urls = shareUrls(id);
        next.push({ name: f.name, size: f.size, embed: urls.embed, app: urls.app, warn });
      }
      setRows((prev) => [...next, ...prev]);
      if (next[0]) {
        try { await navigator.clipboard.writeText(next[0].embed); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'quay failed');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">quay</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">dock a pile. get a slip for each.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not another vault grid. this is a loading dock. every local file goes into the vault, then into the share db, then you get a discord embed url per file.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-12 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? progress || 'docking…' : 'drop a few files'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. only a slowness warning if one is huge.</p>
          </label>
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          <div className="mt-6 space-y-3">
            {rows.map((r, i) => (
              <motion.div
                key={`${r.embed}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-black/30 p-4"
              >
                <p className="text-white text-sm">{r.name}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">{pretty(r.size)}</p>
                {r.warn && <p className="text-amber-300/80 text-xs mt-2">{r.warn}</p>}
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 mt-3 mb-1">discord embed</p>
                <p className="text-sm break-all text-[#0a84ff]">{r.embed}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
