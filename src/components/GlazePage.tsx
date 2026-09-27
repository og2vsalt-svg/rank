import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function GlazePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');

  const paint = async (file: File, contrast = 1.12) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('not an image'));
      img.src = url;
    });
    const c = canvasRef.current;
    if (!c) return null;
    const w = Math.min(1600, img.width);
    const h = Math.round((img.height / img.width) * w);
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.filter = `contrast(${contrast}) saturate(1.08)`;
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    const data = c.toDataURL('image/jpeg', 0.92);
    setPreview(data);
    return data;
  };

  const onFiles = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setLink('');
    setWarn(f.size > 20 * 1024 * 1024 ? 'big still. glaze might take a beat.' : '');
    setBusy(true);
    try {
      const data = await paint(f);
      if (!data) throw new Error('could not glaze');
      const blob = await (await fetch(data)).blob();
      const glazed = new File([blob], f.name.replace(/\.[^.]+$/, '') + '-glaze.jpg', { type: 'image/jpeg' });
      const dt = new DataTransfer();
      dt.items.add(glazed);
      const result = await addFiles(dt.files, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not keep glazed file');
        return;
      }
      const id = result.ids?.[0];
      if (id) {
        const pub = await togglePublic(id);
        if (pub.ok) setLink(shareUrls(id).app);
      }
    } catch (e: any) {
      setErr(e?.message || 'glaze failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">glaze</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a thin coat, then the public shelf.</h1>
          <p className="text-neutral-400 text-sm mb-6">local image only. we bump contrast a little, keep the file, and publish if you are signed in.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'glazing…' : 'drop a still'}</p>
          </label>
          <canvas ref={canvasRef} className="hidden" />
          {preview && <img src={preview} alt="glaze" className="mt-6 w-full rounded-[24px]" />}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">{link}</p>}
          <div className="mt-6 flex gap-2">
            <button onClick={() => navigate('drop')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">drop instead</button>
            <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">vault</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
