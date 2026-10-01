import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function SaggarPage() {
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const fire = async (file?: File) => {
    if (!file) return;
    setErr('');
    setEmbed('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap. large stills just make this tab slower while they encode.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(dataUrl);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'image/png',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'kiln was cold — share db refused the piece');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not fire');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">saggar</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">protect a still, then fire it.</h1>
          <p className="text-neutral-400 text-sm mb-6">preview a local image in the box. publishing writes the original into the share db so discord can unfurl a proper card.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => fire(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'firing…' : 'choose a still'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {preview && <img src={preview} alt="" className="mt-6 w-full rounded-3xl object-cover max-h-80" />}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-rose-300/80 mt-3">{err}</p>}
          {embed && <p className="text-xs text-[#0a84ff] break-all mt-4">{embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
