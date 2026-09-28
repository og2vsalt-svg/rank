import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function HelixPage() {
  const [busy, setBusy] = useState(false);
  const [digest, setDigest] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const run = async (file?: File) => {
    if (!file) return;
    setErr('');
    setLink('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'large file. hashing and encoding may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const hex = await sha256(buf);
      setDigest(hex);
      const blob = new Blob([`${file.name}\n${file.type || 'unknown'}\n${file.size}\nsha256:${hex}\n`], { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.replace(/\.[^.]+$/, '') + '.helix.txt',
          type: 'text/plain',
          size: blob.size,
          dataUrl,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setLink(urls.embed || urls.app);
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'helix failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">helix</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hash locally, publish the receipt.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            the original file stays here. a tiny sha-256 card goes to the share db for discord.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); run(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => run(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'twisting…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">receipt only. no hard size lock.</p>
          </label>
          {digest && <p className="text-xs text-neutral-400 mt-4 break-all">sha256 {digest}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-3 break-all">discord: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
