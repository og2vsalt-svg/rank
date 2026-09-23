import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function NimbusPage() {
  const { addFiles, togglePublic } = useVault();
  const [rows, setRows] = useState<{ name: string; id?: string; link?: string; warn?: string; err?: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    const next: typeof rows = [];
    for (const f of [...list]) {
      const warn = f.size > 40 * 1024 * 1024 ? 'chunky file. encode might lag. no hard stop.' : undefined;
      try {
        const result = await addFiles([f] as unknown as FileList, 'nimbus');
        if (!result.ok) {
          next.push({ name: f.name, err: result.error || 'save failed', warn });
          continue;
        }
        const id = result.ids?.[0];
        if (!id) {
          next.push({ name: f.name, err: 'no id', warn });
          continue;
        }
        const pub = await togglePublic(id);
        next.push({
          name: f.name,
          id,
          link: pub.ok ? shareUrls(id).embed : undefined,
          err: pub.ok ? undefined : pub.error,
          warn,
        });
      } catch (e: any) {
        next.push({ name: f.name, err: e?.message || 'failed' });
      }
    }
    setRows(next);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nimbus</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">batch publish a cloud of files.</h1>
          <p className="text-sm text-neutral-400 mb-6">pick a pile, send each one to the share db, grab discord-ready links. different job than the vault grid.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-8 text-center transition-all duration-300">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing the pile…' : 'drop a bunch of local files'}</p>
            <p className="text-xs text-neutral-500 mt-2">unlimited count. we only warn when a file is huge.</p>
          </label>
          <div className="mt-6 space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                <p className="text-sm text-white truncate">{r.name}</p>
                {r.warn && <p className="text-xs text-amber-300/80 mt-1">{r.warn}</p>}
                {r.err && <p className="text-xs text-red-400 mt-1">{r.err}</p>}
                {r.link && <p className="text-xs text-neutral-500 mt-1 break-all">{r.link}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
