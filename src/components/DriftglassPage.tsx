import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return 'g' + Math.random().toString(36).slice(2, 9);
}

export default function DriftglassPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [alias, setAlias] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ embed: string; token: string } | null>(null);

  const token = useMemo(() => {
    const base = (alias.trim() || file?.name || 'drop').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
    return base + '-' + Date.now().toString(36).slice(-4);
  }, [alias, file]);

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setDone(null);
    try {
      if (file.size > 20 * 1024 * 1024) setWarn('heavy glass. encoding might lag. still no cap.');
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = rid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: user?.username || alias || undefined,
      });
      if (!res.ok) {
        setErr(res.error || 'could not polish this one');
        return;
      }
      const urls = shareUrls(res.id || id);
      setDone({ embed: urls.embed, token });
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'driftglass missed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">driftglass</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">polish a drop, mint a token.</h1>
          <p className="text-neutral-400 text-sm mb-6">local file goes to the share db. you get a pretty token plus the discord /s card. not another vault grid.</p>
          <label className="block rounded-2xl border border-dashed border-white/15 p-8 text-center cursor-pointer hover:border-[#0a84ff]/50 transition mb-4">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-sm text-white">{file ? file.name : 'pick a file'}</p>
          </label>
          <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="optional alias for the token" className="w-full mb-3 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          <p className="text-xs text-neutral-500 mb-4">preview token: {token}</p>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <button disabled={!file || busy} onClick={publish} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'polishing…' : 'publish glass'}</button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {done && (
            <div className="mt-5 space-y-1 text-xs text-neutral-400">
              <p>token: {done.token}</p>
              <p className="break-all text-[#0a84ff]">{done.embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
