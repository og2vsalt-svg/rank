import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function hex(buf: ArrayBuffer, max = 16) {
  return Array.from(new Uint8Array(buf).slice(0, max))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

function guess(sig: string, type: string) {
  if (sig.startsWith('89 50 4e 47')) return 'png';
  if (sig.startsWith('ff d8 ff')) return 'jpeg';
  if (sig.startsWith('47 49 46 38')) return 'gif';
  if (sig.startsWith('25 50 44 46')) return 'pdf';
  if (sig.startsWith('50 4b 03 04')) return 'zip / office';
  if (sig.startsWith('1a 45 df a3')) return 'webm / mkv';
  if (sig.startsWith('00 00 00') && sig.includes('66 74 79 70')) return 'mp4';
  return type || 'unknown';
}

export default function NarthexPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sig, setSig] = useState('');
  const [kind, setKind] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [err, setErr] = useState('');

  const take = async (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setEmbed('');
    setErr('');
    setWarn(f.size > 40 * 1024 * 1024 ? 'no cap, but encoding this size can make the tab feel sleepy.' : '');
    const slice = await f.slice(0, 24).arrayBuffer();
    const h = hex(slice);
    setSig(h);
    setKind(guess(h, f.type));
  };

  const ship = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'publish missed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'narthex failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">narthex</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read the doorway first.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            magic bytes stay on device. then you can publish if you want. discord still uses the /s card.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => take(e.target.files?.[0])} />
            <p className="text-white font-medium">drop one file</p>
            <p className="text-xs text-neutral-500 mt-2">inspect first. upload is optional.</p>
          </label>
          {file && (
            <div className="mt-5 rounded-2xl bg-white/[0.04] border border-white/5 px-4 py-4">
              <p className="text-sm text-white truncate">{file.name}</p>
              <p className="text-[12px] text-neutral-400 mt-1">{pretty(file.size)} · {kind}</p>
              <p className="text-[11px] font-mono text-neutral-500 mt-2 break-all">{sig || '—'}</p>
              <button
                onClick={ship}
                disabled={busy}
                className="mt-4 text-[13px] font-medium px-4 py-2 rounded-full bg-white text-black disabled:opacity-50"
              >
                {busy ? 'shipping…' : 'publish drop'}
              </button>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-3 break-all">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
