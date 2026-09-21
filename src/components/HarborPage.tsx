import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function HarborPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ id: string; embed: string; app: string } | null>(null);

  const onPick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setDone(null);
    setErr('');
    if (f.size > 8 * 1024 * 1024) {
      setWarn('this file is chunky. upload still goes, but the tab or host may feel slow. no hard cap.');
    } else {
      setWarn('');
    }
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not read file'));
        r.readAsDataURL(file);
      });
      const id = rid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        lockPass: pass || undefined,
        author: user?.username,
      });
      if (!res.ok) {
        setErr(res.error || 'could not park the file in the database');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id || id);
      setDone({ id: res.id || id, embed: urls.embed, app: urls.app });
    } catch (e: any) {
      setErr(e?.message || 'upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">harbor</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">park a local file in the cloud</h1>
          <p className="text-sm text-neutral-500 mb-6">
            uploads straight into the share database. discord links get a real embed. no size lock — just a slowness heads-up.
          </p>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          <button
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-sm text-neutral-400 hover:border-white/30 hover:text-white"
          >
            {file ? `${file.name} · ${formatBytes(file.size)}` : 'drop or pick a file from this machine'}
          </button>

          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}

          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="optional passcode"
            className="mt-4 w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />

          <button
            disabled={!file || busy}
            onClick={publish}
            className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'parking…' : 'publish to db'}
          </button>

          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}

          {done && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-neutral-400">live drop</p>
              <p className="break-all text-neutral-300">{done.app}</p>
              <p className="text-neutral-500 text-xs">discord embed url</p>
              <p className="break-all text-[#0a84ff]">{done.embed}</p>
              <button
                onClick={() => navigator.clipboard.writeText(done.embed)}
                className="px-4 py-2 rounded-full bg-white/5 text-sm"
              >
                copy discord link
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
