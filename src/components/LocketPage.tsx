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
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function LocketPage() {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [link, setLink] = useState('');
  const [picked, setPicked] = useState('');

  const send = async (file?: File) => {
    if (!file) return;
    setErr('');
    setPicked(`${file.name} · ${pretty(file.size)}`);
    setWarn(file.size > 40 * 1024 * 1024 ? 'big file. encoding might feel slow, no hard cap tho.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const name = note.trim()
        ? `${note.trim().slice(0, 48).replace(/[/\\]/g, '-')} — ${file.name}`
        : file.name;
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: note.trim().slice(0, 120) || undefined,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'locket failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed || `${window.location.origin}/s/${json.id}`);
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'locket failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">locket</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tuck a note around a file, then send it.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just a tiny inscription that rides on the public drop and the discord card.</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a short line. shows as author on the embed."
            className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 min-h-[88px]"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">{busy ? 'closing the locket…' : 'drop a file into the locket'}</p>
          </label>
          {picked && <p className="text-xs text-neutral-500 mt-4">{picked}</p>}
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
