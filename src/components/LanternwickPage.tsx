import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function LanternwickPage() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [copied, setCopied] = useState('');

  const send = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const name = note.trim() ? `${note.trim()} — ${file.name}` : file.name;
      const res = await publishShare({
        id,
        name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: note.trim() || undefined,
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); setCopied('copied the discord card url'); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'wick failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">lanternwick</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">light a file so discord unfurls it clean.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            optional caption becomes the author line. the /s link is the one bots actually scrape.
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="caption for the card"
            className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'lighting…' : 'drop to light'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file size cap. big ones just warn that the wick is slow.</p>
          </label>
          {copied && <p className="text-xs text-[#0a84ff] mt-4">{copied}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-3 break-all">{embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
