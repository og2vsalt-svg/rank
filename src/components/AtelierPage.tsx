import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return 'at-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function AtelierPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [stamp, setStamp] = useState('rankvault');

  const drawFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMsg('atelier wants an image. other types belong in drop or ferry.');
      return;
    }
    setWarn(file.size > 20 * 1024 * 1024 ? 'big still. the canvas may feel sleepy. no hard cap.' : '');
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('could not read image'));
      img.src = url;
    });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const max = 1400;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(5,5,6,0.42)';
    ctx.fillRect(16, canvas.height - 54, Math.min(canvas.width - 32, 280), 34);
    ctx.fillStyle = '#f5f5f7';
    ctx.font = '500 14px Inter, system-ui, sans-serif';
    ctx.fillText(stamp.slice(0, 42) || 'rankvault', 28, canvas.height - 32);
    URL.revokeObjectURL(url);
    setMsg('stamped. publish when it looks right.');
  };

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width < 8) {
      setMsg('drop an image first.');
      return;
    }
    setBusy(true);
    setMsg('');
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const id = uid();
    const res = await publishShare({
      id,
      name: `atelier-${id}.jpg`,
      type: 'image/jpeg',
      size: Math.floor(((dataUrl.split(',')[1] || '').length * 3) / 4),
      dataUrl,
    });
    setBusy(false);
    if (!res.ok) {
      setMsg(res.error || 'could not park the still');
      return;
    }
    const urls = shareUrls(res.id || id);
    setLink(urls.app);
    setEmbed(urls.embed);
    setMsg('live in the share db. discord will unfurl the embed url.');
    if (res.warn) setWarn(res.warn);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-2xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">
          atelier
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-semibold tracking-tight mb-3">
          stamp a still, then ship it.
        </motion.h1>
        <p className="text-neutral-400 text-sm mb-8 max-w-lg">
          local image desk. drop a photo, add a quiet caption bar, publish to the same cloud table the vault uses.
        </p>
        <div className="glass rounded-[28px] p-6 space-y-4">
          <input
            value={stamp}
            onChange={(e) => setStamp(e.target.value)}
            placeholder="caption on the still"
            className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-[#0a84ff]/50"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) drawFile(f);
            }}
          >
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && drawFile(e.target.files[0])} />
            <p className="text-sm text-neutral-300">drop an image</p>
          </label>
          <canvas ref={canvasRef} className="w-full rounded-2xl bg-black/40 max-h-[420px] object-contain" />
          <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'publishing…' : 'publish still'}
          </button>
          {warn && <p className="text-xs text-amber-300/80">{warn}</p>}
          {msg && <p className="text-xs text-neutral-400">{msg}</p>}
          {link && <p className="text-xs text-neutral-500 break-all">share {link}</p>}
          {embed && <p className="text-xs text-neutral-500 break-all">discord embed {embed}</p>}
        </div>
      </main>
    </div>
  );
}
