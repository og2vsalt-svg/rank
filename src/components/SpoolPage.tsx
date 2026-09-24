import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function SpoolPage() {
  const { files, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const local = useMemo(() => files.slice(0, 40), [files]);

  const toggle = (id: string) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const publishReel = async () => {
    if (!picked.length) return;
    setBusy(true);
    setMsg('');
    const links: string[] = [];
    for (const id of picked) {
      const pub = await togglePublic(id);
      if (pub.ok) links.push(shareUrls(id).embed);
    }
    setBusy(false);
    setMsg(links.length ? `published ${links.length}. discord will unfurl /s/id links.` : 'nothing published — log in first?');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">spool</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">reel of files, not a vault dump.</h1>
          <p className="text-neutral-400 text-sm mb-6">pick a few from your vault and flip them public as a little set. no cap. huge ones just feel slow.</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {local.length === 0 && <p className="text-sm text-neutral-500">vault empty. drop something first.</p>}
            {local.map((f: any) => (
              <button key={f.id} onClick={() => toggle(f.id)} className={`w-full text-left px-4 py-3 rounded-2xl border transition ${picked.includes(f.id) ? 'border-[#0a84ff]/50 bg-[#0a84ff]/10' : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                <p className="text-sm text-white truncate">{f.name || 'untitled'}</p>
                <p className="text-[11px] text-neutral-500">{f.type || 'file'}</p>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            <button disabled={busy || !picked.length} onClick={publishReel} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'publishing…' : 'publish reel'}</button>
            <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">back to vault</button>
          </div>
          {msg && <p className="text-xs text-neutral-400 mt-4">{msg}</p>}
        </motion.div>
      </div>
    </div>
  );
}
