import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read that file'));
    r.readAsDataURL(file);
  });
}

export default function AstragalPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = (f: File | null) => {
    setFile(f);
    setLink('');
    setErr('');
    setWarn(f && f.size > 12 * 1024 * 1024 ? 'large handoff. encoding may feel slow. nothing is refused for size.' : '');
  };

  const send = async () => {
    if (!file) return;
    const label = title.trim() || file.name;
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
        author: 'astragal',
        caption: note.trim() || label,
      });
      if (!res.ok) throw new Error(res.error || 'the moulding did not seat');
      await fetch(`${SB_URL}/rest/v1/handoffs`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id,
          share_id: res.id || id,
          title: label.slice(0, 140),
          note: note.trim().slice(0, 2000),
          author: 'astragal',
        }),
      });
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-7">
          <p className="text-[#0a84ff] text-xs font-medium tracking-wide mb-2">astragal</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">a file with a note attached</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">the bytes land in public shares. the sentence lands in handoffs. discord unfurls the share card. not another drawer in the vault.</p>
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer hover:-translate-y-0.5">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-white text-sm">{file ? file.name : 'choose a local file'}</span>
            {file && <span className="block text-neutral-500 text-xs mt-1">{pretty(file.size)}</span>}
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="handoff title" className="mt-4 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/60" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what should the next person know?" rows={4} className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/60 resize-none" />
          {warn && <p className="text-amber-200/80 text-xs mt-3">{warn}</p>}
          {err && <p className="text-red-300 text-xs mt-3">{err}</p>}
          <button disabled={!file || busy} onClick={send} className="mt-5 w-full rounded-full bg-white text-black text-sm font-medium py-3 disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99]">
            {busy ? 'seating…' : 'seat the handoff'}
          </button>
          {link && (
            <motion.a initial={{ opacity: 0 }} animate={{ opacity: 1 }} href={link} className="block mt-4 text-[#0a84ff] text-sm break-all">{link}</motion.a>
          )}
        </motion.div>
      </div>
    </div>
  );
}
