import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function CoamingPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const publish = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      if (blob.size > 2 * 1024 * 1024) setWarn('long rail. discord still gets a card. the tab may pause while it writes.');
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('read failed'));
        reader.readAsDataURL(blob);
      });
      const id = uid();
      const name = (title.trim() || 'coaming note') + '.txt';
      const res = await publishShare({
        id,
        name,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'coaming',
      });
      if (!res.ok) throw new Error(res.error || 'coaming leaked');
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">coaming</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">raise a lip around a note so it does not spill.</h1>
          <p className="text-neutral-400 text-sm mb-6">this is not the vault. it is a raised edge for plain text that becomes a public share and a discord card.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title for the rail" className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="write the note that should not wash overboard" className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none" />
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={publish} disabled={busy || !body.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'raising the lip…' : 'publish note'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
