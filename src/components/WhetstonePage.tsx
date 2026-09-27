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

function toDataUrl(type: string, buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:${type || 'application/octet-stream'};base64,${btoa(bin)}`;
}

export default function WhetstonePage() {
  const [info, setInfo] = useState<{ name: string; size: number; type: string; hash: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [embed, setEmbed] = useState('');
  const [link, setLink] = useState('');

  const inspect = async (f?: File) => {
    if (!f) return;
    setFile(f);
    setErr('');
    setEmbed('');
    setWarn(f.size > 40 * 1024 * 1024 ? 'hashing a chunky file can stall the tab. still no hard stop.' : '');
    try {
      const buf = await f.arrayBuffer();
      const hash = await sha256(buf);
      setInfo({ name: f.name, size: f.size, type: f.type || 'application/octet-stream', hash });
    } catch (e: any) {
      setErr(e?.message || 'could not inspect');
    }
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const buf = await file.arrayBuffer();
      const dataUrl = toDataUrl(file.type, buf);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: info?.hash.slice(0, 12),
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed || `${window.location.origin}/s/${json.id}`);
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'share failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">whetstone</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sharpen a file into facts, then optionally ship it.</h1>
          <p className="text-neutral-400 text-sm mb-6">local sha-256 + mime peek. share is opt-in so it stays a tool, not another vault clone.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" className="hidden" onChange={(e) => inspect(e.target.files?.[0])} />
            <p className="text-white font-medium">drop a file to inspect</p>
          </label>
          {info && (
            <div className="mt-6 space-y-1 text-sm text-neutral-300">
              <p>{info.name}</p>
              <p className="text-neutral-500 text-xs">{pretty(info.size)} · {info.type}</p>
              <p className="text-[11px] break-all text-neutral-500 font-mono">{info.hash}</p>
              <button
                onClick={send}
                disabled={busy}
                className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
              >
                {busy ? 'sending…' : 'share after the grind'}
              </button>
            </div>
          )}
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
