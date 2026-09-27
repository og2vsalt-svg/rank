import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} mb`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} gb`;
}

export default function PumicePage() {
  const { addFiles, togglePublic } = useVault();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ name: string; size: number; embed: string; warn?: string }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setErr('');
    setBusy(true);
    const next: { name: string; size: number; embed: string; warn?: string }[] = [];
    try {
      for (const f of [...list]) {
        const warn =
          f.size > 80 * 1024 * 1024
            ? 'this one is heavy. still accepted. the tab might stall while it hashes.'
            : f.size > 20 * 1024 * 1024
              ? 'a bit dense. no cap, just a heads up.'
              : undefined;
        const result = await addFiles([f], 'pumice');
        if (!result.ok || !result.ids?.[0]) {
          setErr(result.error || `missed ${f.name}`);
          continue;
        }
        const pub = await togglePublic(result.ids[0]);
        if (!pub.ok) {
          setErr(pub.error || 'local ok, cloud miss');
          continue;
        }
        next.push({ name: f.name, size: f.size, embed: shareUrls(result.ids[0]).embed, warn });
      }
      setRows((p) => [...next, ...p]);
      if (next[0]) {
        try { await navigator.clipboard.writeText(next[0].embed); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'pumice failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">pumice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">scrub a file, keep the grit.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            this desk is for the awkward sizes. we never block a drop. we only whisper if the browser might wheeze. then it still goes to the share db.
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
            <p className="text-white font-medium">{busy ? 'scrubbing…' : 'drop anything'}</p>
            <p className="text-xs text-neutral-500 mt-2">warnings only. no hard file cap.</p>
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
                <p className="text-[11px] text-neutral-500">{pretty(r.size)}</p>
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
