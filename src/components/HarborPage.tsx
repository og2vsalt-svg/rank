import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function HarborPage() {
  const { addFiles, togglePublic, setNote } = useVault();
  const { navigate } = useRouter();
  const [note, setLocalNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [ids, setIds] = useState<string[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'harbor is packed. the tab may nap while encoding. no cap.' : '');
    setErr('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'drops');
      if (!result.ok || !result.ids?.length) {
        setErr(result.error || 'could not dock files');
        return;
      }
      const published: string[] = [];
      for (const id of result.ids) {
        if (note.trim()) setNote(id, note.trim());
        const pub = await togglePublic(id);
        if (pub.ok) published.push(id);
      }
      if (!published.length) {
        setErr('saved locally but cloud publish failed');
        setIds(result.ids);
        return;
      }
      setIds(published);
      try { await navigator.clipboard.writeText(shareUrls(published[0]).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'harbor missed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">harbor</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">tie a note to a pile.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault grid. each file becomes its own public drop with a shared caption and a discord /s card.</p>
          <textarea value={note} onChange={(e) => setLocalNote(e.target.value)} placeholder="optional caption for this batch" className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 min-h-[88px]" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'docking…' : 'drop a pile'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {ids.length > 0 && !err && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400">{ids.length} public drop{ids.length === 1 ? '' : 's'}. first embed copied.</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('share', ids[0])} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open first</button>
                <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">vault</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
