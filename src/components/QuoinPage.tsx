import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function QuoinPage() {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');

  const wedge = async () => {
    if (!file) return;
    setBusy(true); setErr(''); setEmbed('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'large drop. preview clients may feel slow.' : '');
    try {
      const dataUrl = await readAsDataUrl(file);
      const name = caption.trim() ? `${caption.trim().slice(0, 60)} — ${file.name}` : file.name;
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: caption.trim() || undefined,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setEmbed(urls.card);
      try { await navigator.clipboard.writeText(urls.card); } catch {}
      if (json.warn) setWarn(json.warn);
    } catch (e: any) {
      setErr(e?.message || 'quoin failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quoin</p>
          <h1 className="text-3xl font-semibold mb-3">wedge a caption under a public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">skips the vault. the caption becomes the share name so discord unfurls something readable.</p>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the card" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50 mb-4" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-white font-medium">{file ? file.name : 'drop one file'}</p>
            {file && <p className="text-xs text-neutral-500 mt-2">{pretty(file.size)}</p>}
          </label>
          <button disabled={!file || busy} onClick={wedge} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'wedging…' : 'wedge into db'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
