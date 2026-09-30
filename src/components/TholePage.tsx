import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function TholePage() {
  const [pin, setPin] = useState<{ name: string; size: number; type: string; hash: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const inspect = async (f: File) => {
    setErr('');
    setEmbed('');
    setFile(f);
    setWarn(f.size > 40 * 1024 * 1024 ? 'heavy pin. hashing stays in this tab but may take a moment. no cap.' : '');
    setBusy(true);
    try {
      const hash = await sha256(f);
      setPin({ name: f.name, size: f.size, type: f.type || 'application/octet-stream', hash });
    } catch (e: any) {
      setErr(e?.message || 'could not pin');
    } finally {
      setBusy(false);
    }
  };

  const publishCard = async () => {
    if (!pin) return;
    setBusy(true);
    setErr('');
    try {
      const text = `thole pin\nname: ${pin.name}\nsize: ${pin.size}\ntype: ${pin.type}\nsha256: ${pin.hash}\n`;
      const blob = new File([text], `${pin.name}.thole.txt`, { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({ id, name: blob.name, type: blob.type, size: blob.size, dataUrl, author: 'thole' });
      if (!res.ok) throw new Error(res.error || 'publish failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">thole</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pin a local file. share only the receipt.</h1>
          <p className="text-neutral-400 text-sm mb-6">hashing stays on this device. the original never leaves unless you later drop it elsewhere.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) inspect(f); }}>
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && inspect(e.target.files[0])} />
            <p className="text-white font-medium">{busy ? 'pinning…' : 'drop a file onto the thole'}</p>
            <p className="text-xs text-neutral-500 mt-2">sha-256 in the tab. publish a card if you want.</p>
          </label>
          {pin && (
            <div className="mt-6 text-sm text-neutral-300 space-y-1 break-all">
              <p>{pin.name}</p>
              <p className="text-neutral-500">{pretty(pin.size)} · {pin.type}</p>
              <p className="font-mono text-xs text-neutral-400">{pin.hash}</p>
              <button disabled={busy} onClick={publishCard} className="mt-4 px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">publish pin card</button>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
