import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function ConvoyPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ id: string; name: string; link: string }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const big = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'one of these is huge. encoding might make the tab wheeze. no hard cap.' : files.length > 8 ? 'long convoy. give it a second.' : '');
    setErr('');
    setBusy(true);
    const out: { id: string; name: string; link: string }[] = [];
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not save — log in first');
        return;
      }
      const ids = result.ids || [];
      for (const id of ids) {
        const pub = await togglePublic(id);
        if (pub.ok) out.push({ id, name: files[ids.indexOf(id)]?.name || id, link: shareUrls(id).embed });
      }
      if (!out.length) setErr('saved locally but cloud publish missed. try one file on drop.');
      setRows(out);
    } catch (e: any) {
      setErr(e?.message || 'convoy failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">convoy</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">haul a bunch at once.</h1>
          <p className="text-sm text-neutral-400 mb-6">not a vault grid. pick a stack of local files, we publish each one and hand you discord-ready links.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'rolling out…' : 'drop a stack'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. just a slowness note if it gets chunky.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {rows.length > 0 && (
            <ul className="mt-6 space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/5">
                  <button onClick={() => navigate('share', r.id)} className="text-sm text-left truncate flex-1">{r.name}</button>
                  <button onClick={() => navigator.clipboard.writeText(r.link)} className="text-xs text-neutral-400 shrink-0">copy embed</button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
