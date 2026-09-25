import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function OrchardPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [rows, setRows] = useState<{ id: string; name: string; embed: string }[]>([]);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setWarn([...list].some((f) => f.size > 40 * 1024 * 1024) ? 'orchard is heavy. expect lag. no cap.' : '');
    const added = await addFiles(list, 'orchard');
    if (!added.ok || !added.ids?.length) {
      setBusy(false);
      return;
    }
    const next: { id: string; name: string; embed: string }[] = [];
    for (const id of added.ids) {
      await togglePublic(id);
      const f = [...list][added.ids.indexOf(id)];
      next.push({ id, name: f?.name || id, embed: shareUrls(id).embed });
    }
    setRows((prev) => [...next, ...prev].slice(0, 24));
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">orchard</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">plant many drops at once.</h1>
          <p className="text-sm text-neutral-400 mb-6">batch publish. each file gets its own discord /s/ card. not the vault grid.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'planting…' : 'drop a handful'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm truncate">{r.name}</p>
                <p className="text-xs text-neutral-500 break-all mt-1">{r.embed}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigator.clipboard.writeText(r.embed)} className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-medium">copy embed</button>
                  <button onClick={() => navigate('share', r.id)} className="px-4 py-1.5 rounded-full bg-white/10 text-xs">open</button>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
