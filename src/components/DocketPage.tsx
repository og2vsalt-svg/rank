import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export default function DocketPage() {
  const [title, setTitle] = useState('');
  const [who, setWho] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [msg, setMsg] = useState('');
  const [embed, setEmbed] = useState('');

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setMsg('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky attachment. encode may lag. no cap.' : '');
    try {
      const dataUrl = await readFile(file);
      const id = uid();
      const label = (title.trim() || file.name).slice(0, 120);
      const res = await publishShare({
        id,
        name: label,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: who.trim() || undefined,
      });
      if (!res.ok) {
        setMsg(res.error || 'docket missed the db');
      } else {
        setEmbed(shareUrls(res.id || id).embed);
        setMsg(note.trim() ? `filed. note kept locally: ${note.trim().slice(0, 80)}` : 'filed into the public share db.');
        if (res.warn) setWarn(res.warn);
      }
    } catch (e: any) {
      setMsg(e?.message || 'could not read the attachment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">docket</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">intake a file with a label.</h1>
          <p className="text-neutral-400 text-sm mb-6">a desk, not a vault. name the drop, tag who filed it, attach a local file, and it lands in supabase so /s embeds look finished.</p>
          <div className="space-y-3 mb-5">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="matter title" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
            <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="filed by" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="private note (stays in this tab)" rows={3} className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50 resize-none" />
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-5">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-white font-medium">{file ? file.name : 'attach a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. we only warn if the tab might stall.</p>
          </label>
          <button onClick={submit} disabled={!file || busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'filing…' : 'file to share db'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {msg && <p className="text-xs text-neutral-400 mt-4">{msg}</p>}
          {embed && <p className="text-xs text-neutral-500 mt-3 break-all">discord link: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
