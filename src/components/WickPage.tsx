import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return 'w' + Math.random().toString(36).slice(2, 8);
}

export default function WickPage() {
  const { user } = useAuth();
  const [hours, setHours] = useState(24);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ embed: string; app: string; when: string } | null>(null);

  const expiresAt = useMemo(() => new Date(Date.now() + hours * 3600 * 1000).toISOString(), [hours]);

  const burn = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      if (file.size > 15 * 1024 * 1024) setWarn('fat wick. encoding might take a beat. still no cap.');
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
        expiresAt,
        author: user?.username,
      });
      if (!res.ok) {
        setErr(res.error || 'could not light it');
        return;
      }
      const urls = shareUrls(res.id || id);
      setDone({ embed: urls.embed, app: urls.app, when: expiresAt });
    } catch (e: any) {
      setErr(e?.message || 'failed');
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
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">wick</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">share that burns out</h1>
          <p className="text-sm text-neutral-500 mb-6">same db drop as harbor, but with an expiry baked in. discord still gets the embed until it goes cold.</p>

          <label className="block rounded-2xl border border-dashed border-white/15 p-8 text-center cursor-pointer hover:border-white/30">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-sm text-white">{file ? file.name : 'pick a file'}</p>
          </label>

          <label className="block mt-5 text-xs text-neutral-500">
            hours until it snuffs
            <input
              type="range"
              min={1}
              max={168}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full mt-2"
            />
            <span className="text-neutral-300 text-sm">{hours}h · {new Date(expiresAt).toLocaleString()}</span>
          </label>

          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}

          <button
            disabled={!file || busy}
            onClick={burn}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'lighting…' : 'light the wick'}
          </button>

          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {done && (
            <div className="mt-5 text-sm space-y-1">
              <p className="text-neutral-400">dies after {new Date(done.when).toLocaleString()}</p>
              <p className="break-all text-[#0a84ff]">{done.embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
