import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function ClovePage() {
  const [preview, setPreview] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('clove.png');

  const onFile = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr('needs an image so we can redraw it on a canvas.');
      return;
    }
    setErr('');
    setWarn(file.size > 20 * 1024 * 1024 ? 'big still. redraw may feel sticky. no cap.' : '');
    setName(file.name.replace(/\.[^.]+$/, '') + '.png');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const data = canvas.toDataURL('image/png');
      setPreview(data);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const publish = async () => {
    if (!preview) return;
    setBusy(true);
    setErr('');
    try {
      const id = 'clove-' + Date.now().toString(36);
      const approx = Math.floor(((preview.split(',')[1] || '').length * 3) / 4);
      const res = await publishShare({ id, name, type: 'image/png', size: approx, dataUrl: preview });
      if (!res.ok) {
        setErr(res.error || 'publish failed');
        return;
      }
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">clove</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">redraw the picture. drop the pixels.</h1>
          <p className="text-neutral-400 text-sm mb-6">canvas pass strips most embedded metadata. then it ships as a public png with a discord /s card.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-5">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">choose an image</p>
          </label>
          {preview && <img src={preview} alt="" className="w-full rounded-2xl mb-5" />}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          {preview && (
            <button onClick={publish} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'publishing…' : 'publish redrawn png'}</button>
          )}
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
