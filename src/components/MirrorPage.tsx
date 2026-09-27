import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function MirrorPage() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [meta, setMeta] = useState('');

  const pull = async () => {
    setErr('');
    setBusy(true);
    try {
      const src = url.trim();
      if (!/^https?:\/\//i.test(src)) throw new Error('needs an http(s) url');
      const r = await fetch(src);
      if (!r.ok) throw new Error(`fetch ${r.status}`);
      const blob = await r.blob();
      const type = blob.type || 'application/octet-stream';
      const guess = decodeURIComponent(src.split('?')[0].split('/').pop() || 'mirror.bin').slice(0, 180);
      const name = guess.includes('.') ? guess : `${guess || 'mirror'}.bin`;
      setMeta(`${name} · ${pretty(blob.size)} · ${type}`);
      if (blob.size > 40 * 1024 * 1024) setWarn('big mirror. encoding might drag. still no cap.');
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result || ''));
        fr.onerror = () => reject(new Error('could not read remote bytes'));
        fr.readAsDataURL(blob);
      });
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, size: blob.size, dataUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'mirror failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (json.warn) setWarn(json.warn);
    } catch (e: any) {
      setErr(e?.message || 'mirror failed — remote host may block cors');
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
          <p className="text-[#0a84ff] text-sm mb-2">mirror</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pull a public url into our share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">only works when the other host lets the browser read the bytes. if cors says no, download it locally and use parcel.</p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
            placeholder="https://…"
          />
          <button
            onClick={pull}
            disabled={busy || !url.trim()}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'mirroring…' : 'rehost'}
          </button>
          {meta && <p className="text-xs text-neutral-500 mt-4">{meta}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
