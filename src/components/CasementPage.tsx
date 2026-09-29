import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function CasementPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [preview, setPreview] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setLink('');
    setEmbed('');
    if (!f.type.startsWith('image/')) {
      setErr('casement only frames stills.');
      return;
    }
    setWarn(f.size > 20 * 1024 * 1024 ? 'large still. the tab may lag while we frame it. no cap.' : '');
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#050506';
      ctx.fillRect(0, 0, 1200, 1200);
      ctx.drawImage(img, sx, sy, side, side, 40, 40, 1120, 1120);
      setPreview(canvas.toDataURL('image/jpeg', 0.88));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => setErr('could not read that still');
    img.src = url;
  };

  const publish = async () => {
    if (!preview) return;
    setBusy(true);
    setErr('');
    try {
      const pub = await publishShare({
        id: uid(),
        name: 'casement.jpg',
        type: 'image/jpeg',
        size: Math.floor((preview.length * 3) / 4),
        dataUrl: preview,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      const urls = shareUrls(pub.id || '');
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">casement</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">square a still, then open the window.</h1>
          <p className="text-neutral-400 text-sm mb-6">crops to a centered square in the tab. only the framed jpeg hits the share db. discord unfurls /s.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-4">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">drop a still</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness ping if it is huge.</p>
          </label>
          <canvas ref={canvasRef} className="hidden" />
          {preview && <img src={preview} alt="" className="w-full rounded-[24px] mb-4" />}
          {preview && (
            <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'publishing\u2026' : 'publish framed still'}
            </button>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-500 mt-4 break-all">discord card: {embed}</p>}
          {link && <p className="text-xs text-neutral-500 mt-1 break-all">{link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
