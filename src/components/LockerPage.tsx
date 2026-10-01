import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return 'locker-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function LockerPage() {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [name, setName] = useState('');

  const send = async (list?: FileList | null) => {
    const file = list?.[0];
    setErr('');
    setLink('');
    setEmbed('');
    setBusy(true);
    try {
      let dataUrl = '';
      let fileName = 'locker-note.txt';
      let type = 'text/plain';
      let size = 0;
      if (file) {
        setWarn(file.size > 24 * 1024 * 1024 ? 'chunky locker drop. encoding may hitch. no hard cap.' : '');
        dataUrl = await readAsDataUrl(file);
        fileName = file.name;
        type = file.type || 'application/octet-stream';
        size = file.size;
      } else {
        const body = note.trim();
        if (!body) {
          setErr('drop a file or write a note first.');
          return;
        }
        dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(body);
        size = body.length;
        setWarn('');
      }
      setName(fileName);
      const id = uid();
      const res = await publishShare({ id, name: fileName, type, size, dataUrl });
      if (!res.ok) {
        setErr(res.error || 'could not reach the share db');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'locker failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">locker</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a private-feeling drop that still goes public.</h1>
          <p className="text-neutral-400 text-sm mb-6">write a note or attach a local file. it lands in supabase so discord can unfurl /s. not the vault grid.</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="leave a note in the locker…"
            className="w-full min-h-32 rounded-2xl bg-black/30 border border-white/10 p-4 text-sm outline-none focus:border-[#0a84ff]/50 mb-4"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'locking…' : 'drop a file, or keep it as a note'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. only a slowness warning on huge files.</p>
          </label>
          <button
            onClick={() => send()}
            disabled={busy}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'publishing…' : 'publish locker drop'}
          </button>
          {name && <p className="text-xs text-neutral-500 mt-4">{name}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {embed}</p>}
          {link && <p className="text-xs text-neutral-600 mt-1 break-all">{link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
