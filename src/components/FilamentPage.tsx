import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function FilamentPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [text, setText] = useState('');
  const [name, setName] = useState('note.txt');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [id, setId] = useState('');

  const publish = async () => {
    if (!text.trim()) {
      setErr('write something first');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain' });
    if (blob.size > 8 * 1024 * 1024) setWarn('long note. publish may feel slow.');
    const file = new File([blob], name || 'note.txt', { type: 'text/plain' });
    const dt = new DataTransfer();
    dt.items.add(file);
    setBusy(true);
    setErr('');
    try {
      const result = await addFiles(dt.files, 'inbox');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not save');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'cloud publish failed');
        setId(result.ids[0]);
        return;
      }
      setId(result.ids[0]);
    } catch (e: any) {
      setErr(e?.message || 'filament failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">filament</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">spin text into a file.</h1>
          <p className="text-neutral-400 text-sm mb-6">type, name it, ship it to the public shares table. discord unfurl uses /s/id.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="write anything" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y min-h-[180px]" />
          <button onClick={publish} disabled={busy} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'publishing…' : 'publish note'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <button onClick={() => navigate('share', id)} className="block mt-4 text-xs text-neutral-400 hover:text-white break-all">
              {shareUrls(id).embed}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
