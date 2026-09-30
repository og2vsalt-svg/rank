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
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function WindlassPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const take = (f: File | null) => {
    setFile(f);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'no cap. a hoist this heavy may make the tab feel slow.' : '');
    setErr('');
    setEmbed('');
  };

  const hoist = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'windlass',
      });
      if (!res.ok) throw new Error(res.error || 'hoist failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      if (res.warn) setWarn(res.warn);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
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
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">windlass</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hoist one local onto the public capstan.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            the original bytes go to the share db. discord reads /s and paints a card. nothing is capped except patience.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center mb-5 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) take(f);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => take(e.target.files?.[0] || null)} />
            <p className="text-white font-medium">{file ? file.name : 'drop a local here'}</p>
            {file && <p className="text-xs text-neutral-500 mt-2">{pretty(file.size)}</p>}
          </label>
          <button
            disabled={busy || !file}
            onClick={hoist}
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]"
          >
            {busy ? 'taking strain…' : 'hoist to the db'}
          </button>
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 break-all">
              discord (copied): {embed}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
