import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function ScripPage() {
  const { addFiles, togglePublic } = useVault();
  const [note, setNote] = useState('');
  const [hours, setHours] = useState('24');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const issue = async () => {
    const body = note.trim();
    if (!body) {
      setErr('write something first');
      return;
    }
    setBusy(true);
    setErr('');
    setEmbed('');
    try {
      const blob = new Blob([body], { type: 'text/plain' });
      const file = new File([blob], 'scrip.txt', { type: 'text/plain' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const result = await addFiles(dt.files, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not save ticket');
        return;
      }
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'publish failed');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'scrip failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">scrip</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">issue a paper slip.</h1>
          <p className="text-neutral-400 text-sm mb-6">tiny public note as a .txt drop. not the vault. discord card comes back on /s.</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={6} placeholder="what the slip says" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-3" />
          <label className="block text-xs text-neutral-500 mb-4">hint hours (display only — host expiry needs expiresAt on the api)
            <input value={hours} onChange={(e) => setHours(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
          </label>
          <button onClick={issue} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'issuing…' : 'issue slip'}</button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">embed copied: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
