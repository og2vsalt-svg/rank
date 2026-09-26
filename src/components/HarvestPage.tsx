import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function HarvestPage() {
  const { addFiles, togglePublic } = useVault();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [rows, setRows] = useState<{ name: string; size: number; id?: string; link?: string; err?: string }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const total = files.reduce((a, f) => a + f.size, 0);
    setWarn(total > 40 * 1024 * 1024 ? 'this harvest is heavy. encoding may stall the tab. no cap, just lag.' : '');
    setBusy(true);
    const next: typeof rows = [];
    for (const f of files) {
      try {
        const result = await addFiles([f] as unknown as FileList, 'inbox');
        if (!result.ok || !result.ids?.[0]) {
          next.push({ name: f.name, size: f.size, err: result.error || 'save failed' });
          continue;
        }
        const id = result.ids[0];
        const pub = await togglePublic(id);
        const urls = shareUrls(id);
        next.push({
          name: f.name,
          size: f.size,
          id,
          link: pub.ok ? urls.embed : urls.app,
          err: pub.ok ? undefined : pub.error,
        });
      } catch (e: any) {
        next.push({ name: f.name, size: f.size, err: e?.message || 'drop failed' });
      }
    }
    setRows(next);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">harvest</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop a pile. get a row of links.</h1>
          <p className="text-neutral-400 text-sm mb-6">each file lands in the vault then publishes to the public table. discord cards live at the /s/ links.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing harvest…' : 'drop several files'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. huge batches just feel slow.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {rows.length > 0 && (
            <ul className="mt-6 space-y-2">
              {rows.map((r) => (
                <li key={r.name + r.size} className="rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500">{pretty(r.size)}{r.err ? ' · ' + r.err : ''}</p>
                  {r.link && <p className="text-[11px] text-[#0a84ff] break-all mt-1">{r.link}</p>}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
