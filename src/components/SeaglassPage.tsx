import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function SeaglassPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    setName(file.name);
    setErr('');
    setLink('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky file. encoding might feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not read file'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: note || undefined,
      });
      if (!res.ok) {
        setErr(res.error || 'cloud write failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">seaglass</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tumble a local file into the public db.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault drawer. just a beach-smooth share. discord picks up the /s/ card.</p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional author line"
            className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">{busy ? 'polishing…' : name || 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">warning only if it is huge. nothing gets blocked.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>app: {link}</p>
              <p>discord embed: {embed}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
