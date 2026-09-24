import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

type Row = { name: string; size: number; status: string; link?: string };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function SluicePage() {
  const { addFiles, togglePublic } = useVault();
  const [rows, setRows] = useState<Row[]>([]);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    setWarn(files.some((f) => f.size > 40 * 1024 * 1024) ? 'something in this queue is chunky. expect lag. still no hard cap.' : '');
    setBusy(true);
    const next: Row[] = files.map((f) => ({ name: f.name, size: f.size, status: 'queued' }));
    setRows(next);
    for (let i = 0; i < files.length; i++) {
      setRows((r) => r.map((row, idx) => (idx === i ? { ...row, status: 'uploading' } : row)));
      const dt = new DataTransfer();
      dt.items.add(files[i]);
      try {
        const result = await addFiles(dt.files, 'inbox');
        if (!result.ok) {
          setRows((r) => r.map((row, idx) => (idx === i ? { ...row, status: result.error || 'failed' } : row)));
          continue;
        }
        const id = result.ids?.[0];
        if (!id) {
          setRows((r) => r.map((row, idx) => (idx === i ? { ...row, status: 'saved local' } : row)));
          continue;
        }
        const pub = await togglePublic(id);
        const urls = shareUrls(id);
        setRows((r) => r.map((row, idx) => (idx === i ? { ...row, status: pub.ok ? 'live' : 'local only', link: pub.ok ? urls.embed : undefined } : row)));
      } catch (e: any) {
        setRows((r) => r.map((row, idx) => (idx === i ? { ...row, status: e?.message || 'failed' } : row)));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">sluice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">queue files, one after another.</h1>
          <p className="text-neutral-400 text-sm mb-6">each file hits the vault then the public db. links are discord-ready /s embeds.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); run(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => run(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'draining the queue…' : 'drop a pile here'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.name + row.size} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{row.name}</p>
                  <p className="text-[11px] text-neutral-500">{pretty(row.size)} · {row.status}</p>
                  {row.link && <p className="text-[11px] text-[#0a84ff] break-all mt-1">{row.link}</p>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
