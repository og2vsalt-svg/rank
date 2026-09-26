import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function MeadowPage() {
  const { addText, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [title, setTitle] = useState('meadow.txt');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);

  const publish = async () => {
    if (!body.trim()) {
      setErr('write something first');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const result = await addText(title || 'meadow.txt', body, 'notes');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not keep note');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved but publish failed');
        setLastId(result.ids[0]);
        return;
      }
      setLastId(result.ids[0]);
      try { await navigator.clipboard.writeText(shareUrls(result.ids[0]).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'meadow missed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">meadow</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">write, then let it grow public.</h1>
          <p className="text-neutral-400 text-sm mb-6">plain text becomes a .txt drop on the share db. not a vault grid. discord embed is /s.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="type the note" className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 min-h-[160px]" />
          <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'planting…' : 'publish note'}</button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {lastId && !err && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => navigate('share', lastId)} className="px-5 py-2.5 rounded-full bg-white/10 text-sm">open share</button>
              <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">vault</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
