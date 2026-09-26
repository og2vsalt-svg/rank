import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function FlintPage() {
  const [name, setName] = useState('');
  const [digest, setDigest] = useState('');
  const [size, setSize] = useState(0);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    setErr('');
    setLink('');
    setName(file.name);
    setSize(file.size);
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky flint. hashing then encoding may lag. no cap.' : '');
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const hex = await sha256(buf);
      setDigest(hex);
      const blob = new Blob([`flint\n${file.name}\n${file.type || 'file'}\n${file.size}\nsha256 ${hex}\n`], { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: `${file.name}.flint.txt`,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish fingerprint');
        return;
      }
      setLink(shareUrls(id).embed);
      try { await navigator.clipboard.writeText(shareUrls(id).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'flint missed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">flint</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">strike a hash, keep the spark.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. hashes the file in this tab then publishes a tiny fingerprint card so discord can unfurl /s.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}>
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'striking…' : 'drop a file to fingerprint'}</p>
          </label>
          {name && <p className="text-xs text-neutral-400 mt-4">{name} · {size.toLocaleString()} bytes</p>}
          {digest && <p className="text-[11px] text-neutral-500 mt-2 break-all font-mono">sha256 {digest}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-3 break-all">discord card copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
