import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function EmberlinePage() {
  const { addFiles, togglePublic } = useVault();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState('');
  const [warm, setWarm] = useState(28);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const fileRef = useRef<File | null>(null);

  const draw = (img: HTMLImageElement, amount: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = Math.min(1600, img.naturalWidth || img.width);
    const scale = w / (img.naturalWidth || img.width || 1);
    const h = Math.round((img.naturalHeight || img.height) * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    const a = amount / 100;
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = Math.min(255, data.data[i] + 38 * a);
      data.data[i + 1] = Math.min(255, data.data[i + 1] + 12 * a);
      data.data[i + 2] = Math.max(0, data.data[i + 2] - 18 * a);
    }
    ctx.putImageData(data, 0, 0);
    setPreview(canvas.toDataURL('image/jpeg', 0.92));
  };

  const load = (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) setWarn('chunky photo. the canvas might nap a second. no cap.');
    else setWarn('');
    fileRef.current = file;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      draw(img, warm);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('empty canvas'))), 'image/jpeg', 0.92);
      });
      const file = new File([blob], `emberline-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const result = await addFiles([file] as unknown as FileList, 'inbox');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not park the still');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved locally, cloud missed');
        return;
      }
      const urls = shareUrls(result.ids[0]);
      setLink(urls.embed || urls.app);
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'emberline failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">emberline</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">warm a still, then share it.</h1>
          <p className="text-neutral-400 text-sm mb-6">not another vault grid. grade a photo on device, publish the jpeg, copy the discord /s card.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-5">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => load(e.target.files)} />
            <p className="text-white font-medium">drop a photo</p>
            <p className="text-xs text-neutral-500 mt-2">stays on device until you publish.</p>
          </label>
          <canvas ref={canvasRef} className="hidden" />
          {preview && (
            <>
              <img src={preview} alt="warm preview" className="w-full rounded-2xl mb-4 border border-white/10" />
              <label className="block text-xs text-neutral-400 mb-4">
                warmth {warm}
                <input type="range" min={0} max={80} value={warm} onChange={(e) => {
                  const v = Number(e.target.value);
                  setWarm(v);
                  const img = new Image();
                  img.onload = () => draw(img, v);
                  img.src = preview;
                }} className="w-full mt-2" />
              </label>
              <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition">
                {busy ? 'publishing…' : 'publish still'}
              </button>
            </>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
