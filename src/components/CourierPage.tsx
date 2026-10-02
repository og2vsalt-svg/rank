import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function CourierPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pass, setPass] = useState('');
  const [hours, setHours] = useState('48');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [error, setError] = useState('');
  const [links, setLinks] = useState<{ embed: string; app: string } | null>(null);

  const send = async () => {
    if (!file) {
      setError('pick a local file');
      return;
    }
    setBusy(true);
    setError('');
    const hrs = Number(hours);
    const expiresAt = Number.isFinite(hrs) && hrs > 0 ? new Date(Date.now() + hrs * 3600 * 1000).toISOString() : null;
    const res = await publishLocalFile(file, { lockPass: pass || undefined, expiresAt, caption: caption || undefined, cardTitle: file.name });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'could not file');
      return;
    }
    const urls = shareUrls(res.id);
    setLinks({ embed: res.embed || urls.embed, app: urls.app });
    setWarn(res.warn || (file.size > 20 * 1024 * 1024 ? 'large drop. the send may feel slow. it is not refused.' : ''));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2">courier</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">a file with a time on it.</h1>
          <p className="text-neutral-400 mb-8">Uploads the local file into the share database. Optional passcode, optional expiry. The /s link is the Discord card.</p>
        </motion.div>
        <div className="glass rounded-3xl p-6 space-y-4">
          <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center cursor-pointer">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-white">{file ? file.name : 'choose a file'}</span>
          </label>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption on the card" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="passcode, optional" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          <label className="block text-xs text-neutral-500">hours until it expires
            <input value={hours} onChange={(e) => setHours(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
          </label>
          {warn && <p className="text-xs text-amber-300/90">{warn}</p>}
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button disabled={busy} onClick={send} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'sending…' : 'file and share'}</button>
        </div>
        {links && (
          <div className="mt-5 glass rounded-3xl p-5 text-sm space-y-2">
            <p className="text-neutral-400">discord card</p>
            <p className="text-white break-all">{links.embed}</p>
            <button onClick={() => navigator.clipboard.writeText(links.embed)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy card link</button>
          </div>
        )}
      </main>
    </div>
  );
}
