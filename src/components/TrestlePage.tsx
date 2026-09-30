import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function TrestlePage() {
  const [left, setLeft] = useState<{ name: string; size: number; hash: string } | null>(null);
  const [right, setRight] = useState<{ name: string; size: number; hash: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const weigh = async (side: 'left' | 'right', file: File) => {
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap. hashing a file this heavy can make the tab feel slow.' : '');
    const hash = await sha256(file);
    const row = { name: file.name, size: file.size, hash };
    if (side === 'left') setLeft(row);
    else setRight(row);
  };

  const publishReceipt = async () => {
    if (!left || !right) return;
    setBusy(true);
    setErr('');
    setEmbed('');
    try {
      const same = left.hash === right.hash;
      const text = [
        'trestle receipt',
        `left: ${left.name} ${pretty(left.size)} ${left.hash}`,
        `right: ${right.name} ${pretty(right.size)} ${right.hash}`,
        same ? 'same timber.' : 'different grain.',
      ].join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'trestle.txt', { type: 'text/plain' });
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
        type: 'text/plain',
        size: file.size,
        dataUrl,
        author: 'trestle',
      });
      if (!res.ok) throw new Error(res.error || 'trestle failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'trestle failed');
    } finally {
      setBusy(false);
    }
  };

  const Slot = ({ side }: { side: 'left' | 'right' }) => {
    const row = side === 'left' ? left : right;
    return (
      <label
        className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-6 text-center transition-all duration-300"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) weigh(side, f);
        }}
      >
        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && weigh(side, e.target.files[0])} />
        <p className="text-sm text-neutral-300">{side} timber</p>
        {row ? (
          <p className="text-xs text-neutral-500 mt-2 break-all">
            {row.name} · {pretty(row.size)}
            <br />
            {row.hash.slice(0, 24)}…
          </p>
        ) : (
          <p className="text-xs text-neutral-500 mt-2">drop a local file</p>
        )}
      </label>
    );
  };

  const match = left && right ? left.hash === right.hash : null;

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
          <p className="text-[#0a84ff] text-sm mb-2">trestle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lay two locals across a beam and compare their grain.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            hashes stay in the tab. if you want a public receipt, only that tiny .txt goes to the share db. discord unfurls /s.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            <Slot side="left" />
            <Slot side="right" />
          </div>
          {match !== null && (
            <p className={`text-sm mb-4 ${match ? 'text-emerald-300' : 'text-amber-200'}`}>
              {match ? 'same timber.' : 'different grain.'}
            </p>
          )}
          <button
            disabled={busy || !left || !right}
            onClick={publishReceipt}
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'setting the beam…' : 'publish receipt'}
          </button>
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
