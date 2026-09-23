import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

type Row = { name: string; id?: string; link?: string; embed?: string; error?: string; warn?: string };

export default function ParcelPage() {
  const { addFiles, togglePublic } = useVault();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    if (files.some((f) => f.size > 40 * 1024 * 1024)) setWarn('at least one file is chunky. expect lag, no hard cap.');
    else setWarn('');
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      try {
        const fake = {
          0: file,
          length: 1,
          item: (i: number) => (i === 0 ? file : null),
          [Symbol.iterator]: function* () { yield file; },
        } as unknown as FileList;
        const result = await addFiles(fake, 'parcel');
        if (!result.ok || !result.ids?.[0]) {
          next.push({ name: file.name, error: result.error || 'save failed' });
          continue;
        }
        const id = result.ids[0];
        const pub = await togglePublic(id);
        const urls = shareUrls(id);
        next.push({
          name: file.name,
          id,
          link: urls.app,
          embed: urls.embed,
          error: pub.ok ? undefined : pub.error,
          warn: result.warn,
        });
      } catch (e: any) {
        next.push({ name: file.name, error: e?.message || 'failed' });
      }
    }
    setRows(next);
    setBusy(false);
  };

  const copyAll = async () => {
    const text = rows.filter((r) => r.embed).map((r) => `${r.name}\n${r.embed}`).join('\n\n');
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">parcel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">one pile, many discord links.</h1>
          <p className="text-neutral-400 text-sm mb-6">batch publish local files. each one gets its own /s/ embed card.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'packing…' : 'drop a handful of files'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {rows.length > 0 && (
            <div className="mt-6 space-y-3">
              <button onClick={copyAll} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy embed links</button>
              {rows.map((r) => (
                <div key={r.name + (r.id || '')} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  {r.embed && <p className="text-xs text-neutral-500 break-all mt-1">{r.embed}</p>}
                  {r.error && <p className="text-xs text-red-400 mt-1">{r.error}</p>}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
