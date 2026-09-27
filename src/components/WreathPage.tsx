import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function WreathPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const wrap = async () => {
    if (!file && !note.trim()) return;
    setBusy(true);
    setErr('');
    const parts: string[] = [];
    if (note.trim()) parts.push(note.trim());
    let dataUrl = '';
    let name = 'wreath.txt';
    let type = 'text/plain';
    let size = 0;
    if (file) {
      if (file.size > 40 * 1024 * 1024) setWarn('big wrap. tab may hitch while reading. no hard limit.');
      dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      name = file.name;
      type = file.type || 'application/octet-stream';
      size = file.size;
    } else {
      const blob = new Blob([parts.join('\n\n')], { type: 'text/plain' });
      dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.readAsDataURL(blob);
      });
      size = blob.size;
    }
    const id = uid();
    const res = await publishShare({ id, name, type, size, dataUrl });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'wrap failed');
      return;
    }
    if (res.warn) setWarn(res.warn);
    setLink(shareUrls(id).embed);
    try { await navigator.clipboard.writeText(shareUrls(id).embed); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">wreath</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tie a note around a file.</h1>
          <p className="text-neutral-400 text-sm mb-6">optional caption plus one local file. publishes to the share db. embed link is what discord unfurls.</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="caption (optional if you attach a file)"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 transition mb-4"
          />
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-6 text-center text-sm text-neutral-300 transition">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? file.name : 'optional local file'}
          </label>
          <button onClick={wrap} disabled={busy} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'wrapping…' : 'publish wreath'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-3 break-all">copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
