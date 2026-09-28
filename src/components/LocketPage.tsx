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

export default function LocketPage() {
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [warn, setWarn] = useState('');

  const send = async (file?: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setErr('needs a still');
      return;
    }
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'large still. encoding may feel slow. no cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(dataUrl);
      const name = caption.trim() ? `${caption.trim().slice(0, 40)}.${(file.name.split('.').pop() || 'jpg')}` : file.name;
      const res = await publishShare({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name,
        type: file.type,
        size: file.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'locket failed');
      setEmbed(shareUrls(res.id || '').embed);
    } catch (e: any) {
      setErr(e?.message || 'locket failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[36px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">locket</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">one still, a little frame.</h1>
          <p className="text-neutral-400 text-sm mb-6">caption optional. ships as a public drop with a discord card.</p>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="tiny caption" className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <label className="block cursor-pointer rounded-[28px] overflow-hidden border border-white/10 bg-black/30 min-h-56">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            {preview ? <img src={preview} alt="" className="w-full object-cover" /> : <p className="text-center text-sm text-neutral-500 py-24">{busy ? 'setting the glass…' : 'tap to frame a still'}</p>}
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
