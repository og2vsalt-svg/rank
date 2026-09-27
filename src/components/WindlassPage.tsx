import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function WindlassPage() {
  const { files, togglePublic, setLock, setNote } = useVault();
  const { navigate } = useRouter();
  const [pick, setPick] = useState('');
  const [lock, setLockVal] = useState('');
  const [note, setNoteVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const hoist = async () => {
    if (!pick) return;
    setBusy(true);
    setErr('');
    try {
      if (note) setNote(pick, note);
      if (lock) setLock(pick, lock);
      const pub = await togglePublic(pick);
      if (!pub.ok) {
        setErr(pub.error || 'cloud publish failed');
        return;
      }
      const urls = shareUrls(pick);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'hoist failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">windlass</p>
          <h1 className="text-3xl font-semibold mb-3">hoist a vault file public.</h1>
          <p className="text-neutral-400 text-sm mb-6">optional lock + note, then publish to the share db. discord gets the /s card.</p>
          {files.length === 0 ? (
            <p className="text-sm text-neutral-500">vault is empty. drop something first.</p>
          ) : (
            <div className="space-y-3">
              <select value={pick} onChange={(e) => setPick(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none">
                <option value="">pick a file</option>
                {files.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} · {formatBytes(f.size)}</option>
                ))}
              </select>
              <input value={lock} onChange={(e) => setLockVal(e.target.value)} placeholder="optional lock phrase" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none" />
              <input value={note} onChange={(e) => setNoteVal(e.target.value)} placeholder="optional note" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none" />
              <button onClick={hoist} disabled={!pick || busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'hoisting…' : 'hoist public'}</button>
            </div>
          )}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <p className="text-xs text-neutral-600 break-all">{link}</p>
              <button onClick={() => navigate('share', pick)} className="px-5 py-2.5 rounded-full bg-white/8 text-sm">open share page</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
