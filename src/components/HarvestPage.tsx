import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function HarvestPage() {
  const { files, addText, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [packId, setPackId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const harvest = async () => {
    const rows = files.filter((f) => picked.includes(f.id));
    if (!rows.length) {
      setErr('pick at least one file from your vault');
      return;
    }
    setBusy(true);
    setErr('');
    const body = rows
      .map((f) => `- ${f.name} (${f.type || 'file'}, ${f.size} bytes)${f.public ? ' · already public' : ''}`)
      .join('\n');
    const manifest = `harvest pack\n${new Date().toISOString()}\n\n${body}\n`;
    try {
      const result = await addText(`harvest-${Date.now().toString(36)}.txt`, manifest, 'drops');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not write pack list');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'list saved, cloud miss');
        return;
      }
      setPackId(result.ids[0]);
      try { await navigator.clipboard.writeText(shareUrls(result.ids[0]).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'harvest failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">harvest</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">bundle names into a public pack list.</h1>
          <p className="text-sm text-neutral-400 mb-6">this is a field desk, not the vault. tick files you already have, publish a plain list people can open on discord.</p>
          <div className="max-h-64 overflow-y-auto space-y-1 mb-5">
            {files.length === 0 && <p className="text-sm text-neutral-500">vault is empty. drop something first.</p>}
            {files.slice(0, 40).map((f) => (
              <button key={f.id} onClick={() => toggle(f.id)} className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${picked.includes(f.id) ? 'bg-[#0a84ff]/20 text-white' : 'bg-white/5 text-neutral-400 hover:text-white'}`}>
                {f.name}
              </button>
            ))}
          </div>
          <button onClick={harvest} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'gathering…' : 'publish pack list'}</button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {packId && (
            <div className="mt-5">
              <button onClick={() => navigate('share', packId)} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">open pack share</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
