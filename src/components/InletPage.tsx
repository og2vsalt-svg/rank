import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare } from '../lib/cloudShare';
import { useVault } from './VaultContext';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';

export default function InletPage() {
  const [id, setId] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const { addText } = useVault();
  const { isLoggedIn } = useAuth();
  const { navigate } = useRouter();

  const pull = async () => {
    const slug = id.trim();
    if (!slug) return;
    setBusy(true);
    setMsg('');
    try {
      const meta = await fetchShare(slug);
      if (!meta) {
        setMsg('no live public drop for that id');
        return;
      }
      const body = [
        meta.name,
        meta.type,
        `${meta.size} bytes`,
        meta.url?.startsWith('http') ? meta.url : '(inline payload)',
        meta.author ? `author ${meta.author}` : '',
      ].filter(Boolean).join('\n');
      if (isLoggedIn) {
        const res = await addText(`${meta.name}.inlet.txt`, body, 'inbox');
        setMsg(res.ok ? 'pulled metadata into your vault inbox' : (res.error || 'could not save locally'));
      } else {
        setMsg(`${meta.name} · ${meta.type} · live`);
      }
    } catch (e: any) {
      setMsg(e?.message || 'inlet failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">inlet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pull a public drop in.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. we check the db and stash a note in your vault if you are signed in.</p>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
          <div className="flex flex-wrap gap-2">
            <button onClick={pull} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'checking…' : 'pull'}</button>
            <button onClick={() => navigate('share', id.trim())} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">open share page</button>
          </div>
          {msg && <p className="text-xs text-neutral-400 mt-4">{msg}</p>}
        </motion.div>
      </div>
    </div>
  );
}
