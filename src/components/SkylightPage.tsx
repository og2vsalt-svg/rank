import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function sampleColor(src: string) {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 8;
      c.height = 8;
      const ctx = c.getContext('2d');
      if (!ctx) {
        resolve('#0a84ff');
        return;
      }
      ctx.drawImage(img, 0, 0, 8, 8);
      const data = ctx.getImageData(0, 0, 8, 8).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n += 1;
      }
      r = Math.round(r / n);
      g = Math.round(g / n);
      b = Math.round(b / n);
      resolve('#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join(''));
    };
    img.onerror = () => resolve('#0a84ff');
    img.src = src;
  });
}

function paintCard(hex: string, name: string) {
  const c = document.createElement('canvas');
  c.width = 1200;
  c.height = 630;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#050506';
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = hex;
  ctx.beginPath();
  ctx.roundRect(80, 80, 1040, 470, 48);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(80, 430, 1040, 120);
  ctx.fillStyle = '#f5f5f7';
  ctx.font = '600 42px Inter, system-ui, sans-serif';
  ctx.fillText(name.slice(0, 42), 120, 500);
  ctx.font = '400 24px Inter, system-ui, sans-serif';
  ctx.fillText(hex + '  ·  skylight', 120, 540);
  return c.toDataURL('image/png');
}

export default function SkylightPage() {
  const [hex, setHex] = useState('#0a84ff');
  const [name, setName] = useState('');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const take = async (file?: File) => {
    if (!file) return;
    setErr('');
    setEmbed('');
    setName(file.name);
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap. a huge still can make sampling feel slow.' : '');
    const url = URL.createObjectURL(file);
    try {
      const color = file.type.startsWith('image/') ? await sampleColor(url) : '#0a84ff';
      setHex(color);
      setPreview(paintCard(color, file.name));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const ship = async () => {
    if (!preview) return;
    setBusy(true);
    setErr('');
    try {
      const id = uid();
      const res = await publishShare({
        id,
        name: (name || 'skylight') + '.png',
        type: 'image/png',
        size: Math.floor((preview.split(',')[1] || '').length * 0.75),
        dataUrl: preview,
        author: 'skylight',
      });
      if (!res.ok) throw new Error(res.error || 'publish failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'skylight failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">skylight</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">sample a still, paint a color pane, ship only the pane.</h1>
          <p className="text-neutral-400 text-sm mb-6">the original file stays on the device. discord unfurls the 1200×630 card from /s.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-8 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" accept="image/*" className="hidden" onChange={(e) => take(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">drop a still through the glass</p>
          </label>
          {preview && (
            <div className="mt-6 space-y-4">
              <img src={preview} alt="" className="w-full rounded-2xl" />
              <p className="text-sm text-neutral-400">{hex} · {name}</p>
              <button disabled={busy} onClick={ship} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
                {busy ? 'opening the pane…' : 'publish color card'}
              </button>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord: {embed}</p>}
        </motion.div>
      </main>
    </div>
  );
}
