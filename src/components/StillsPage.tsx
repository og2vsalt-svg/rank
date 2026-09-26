import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function StillsPage() {
  const [preview, setPreview] = useState('');
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setErr('');
    setLink('');
    setName(file.name);
    setWarn(file.size > 40 * 1024 * 1024 ? 'heavy still. the tab may nap while it encodes. no cap.' : '');
    const obj = URL.createObjectURL(file);
    setPreview(file.type.startsWith('image/') ? obj : '');
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish still');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'stills missed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">stills</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">one frame. one card.</h1>
          <p className="text-neutral-400 text-sm mb-6">drop an image or clip. we host it and hand you a /s link discord can unfurl with the actual picture when it is an image.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'developing…' : 'drop a still'}</p>
          </label>
          {preview && (
            <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={preview} alt="" className="mt-6 w-full rounded-2xl" />
          )}
          {name && <p className="text-xs text-neutral-500 mt-3">{name}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-3 break-all">discord embed: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
