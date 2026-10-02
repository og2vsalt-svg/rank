import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function TransomPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('');
  const [lift, setLift] = useState(8);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');
  const [ready, setReady] = useState(false);

  const paint = (file: File) => {
    setErr('');
    setCard('');
    setName(file.name);
    setWarn(file.size > 18 * 1024 * 1024 ? 'large still. drawing it may hitch. it is not refused.' : '');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const max = 1400;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.filter = `brightness(${1 + lift / 100}) contrast(1.04)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      setReady(true);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setErr('that file did not draw as an image');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const fileIt = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    setBusy(true);
    setErr('');
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        setErr('could not flatten the still');
        return;
      }
      const file = new File([blob], (name.replace(/\.[^.]+$/, '') || 'transom') + '.png', { type: 'image/png' });
      const result = await publishLocalFile(file, {
        caption: 'a transom still',
        cardTitle: file.name,
        author: 'transom',
        color: '#64D2FF',
      });
      if (!result.ok || !result.id) {
        setErr(result.error || 'share table refused the still');
        return;
      }
      const urls = shareUrls(result.id);
      setCard(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'file failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#64d2ff] text-sm mb-2">transom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a still, lifted, then filed.</h1>
          <p className="text-neutral-400 text-sm mb-6">the original stays on the machine. the PNG that lands in the share table is what Discord unfurls.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#64d2ff]/50 p-8 text-center transition duration-300 mb-5">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) paint(f); }} />
            <p className="text-white font-medium">{name || 'choose a local still'}</p>
          </label>
          <label className="block text-xs text-neutral-500 mb-4">lift {lift}
            <input type="range" min={0} max={40} value={lift} onChange={(e) => setLift(Number(e.target.value))} className="w-full mt-2" />
          </label>
          <canvas ref={canvasRef} className="w-full rounded-2xl bg-black/30 mb-5" />
          <button onClick={fileIt} disabled={!ready || busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'filing…' : 'file the still'}</button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {card && <p className="text-xs text-neutral-400 mt-4 break-all">discord card copied: {card}</p>}
        </motion.div>
      </div>
    </div>
  );
}
