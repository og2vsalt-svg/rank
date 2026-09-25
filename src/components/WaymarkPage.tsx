import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function WaymarkPage() {
  const { addFiles, setNote, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [when, setWhen] = useState('');
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [id, setId] = useState<string | null>(null);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'heavy file. encoding may stutter. still no cap.' : '');
    setErr('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'drops');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not park the file');
        return;
      }
      const fid = result.ids[0];
      const stamp = when || 'unscheduled';
      setNote(fid, `waymark · open around ${stamp}${hint.trim() ? ' · ' + hint.trim() : ''}`);
      const pub = await togglePublic(fid);
      if (!pub.ok) {
        setErr(pub.error || 'saved, cloud miss');
        setId(fid);
        return;
      }
      setId(fid);
      try { await navigator.clipboard.writeText(shareUrls(fid).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'waymark failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">waymark</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pin a file to a time, then publish.</h1>
          <p className="text-sm text-neutral-400 mb-6">not a vault browser. you drop one file, stamp when to open it, and the note rides with the public share.</p>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-3" />
          <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="why this hour" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-5" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'planting…' : 'drop the file on this hour'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => navigate('share', id)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share</button>
              <p className="text-xs text-neutral-500 self-center">embed copied to clipboard</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
