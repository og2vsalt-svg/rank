import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function PintlePage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const hinge = async () => {
    setErr('');
    if (!file) {
      setErr('hinge a local file first');
      return;
    }
    setWarn(file.size > 4 * 1024 * 1024 ? 'large hinge. the tab may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'pintle',
      });
      if (!res.ok) throw new Error(res.error || 'hinge failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'hinge failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">pintle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hinge a local file onto the public pin.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. pick anything from disk, upload it to the share db. discord cards on /s.
          </p>
          <label className="block rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center cursor-pointer hover:border-[#0a84ff]/40 transition-colors mb-5">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setWarn(f && f.size > 4 * 1024 * 1024 ? 'large hinge. the tab may feel slow. no hard cap.' : '');
              }}
            />
            <p className="text-sm text-neutral-300">{file ? file.name : 'drop or choose a file'}</p>
            {file && <p className="text-xs text-neutral-500 mt-2">{pretty(file.size)}</p>}
          </label>
          <button
            disabled={busy}
            onClick={hinge}
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'hinging…' : 'publish hinge'}
          </button>
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>discord (copied): {embed}</p>
              <p>app: {app}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
