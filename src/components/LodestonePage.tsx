import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function card(file: File) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('no canvas'));
  const g = ctx.createLinearGradient(0, 0, 1200, 630);
  g.addColorStop(0, '#0b0b0d');
  g.addColorStop(1, '#12233a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = '#0a84ff';
  ctx.font = '600 28px ui-sans-serif, system-ui';
  ctx.fillText('lodestone', 72, 120);
  ctx.fillStyle = '#f5f5f7';
  ctx.font = '600 52px ui-sans-serif, system-ui';
  const name = file.name.length > 36 ? file.name.slice(0, 34) + '…' : file.name;
  ctx.fillText(name, 72, 210);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '400 28px ui-sans-serif, system-ui';
  ctx.fillText(`${pretty(file.size)}  ·  ${file.type || 'unknown'}`, 72, 280);
  ctx.fillText(`touched  ${new Date(file.lastModified).toLocaleString()}`, 72, 330);
  ctx.fillStyle = '#52525b';
  ctx.font = '400 20px ui-sans-serif, system-ui';
  ctx.fillText('rankvault  ·  local file card, then a public drop', 72, 560);
  return new Promise<string>((resolve) => resolve(canvas.toDataURL('image/jpeg', 0.92)));
}

export default function LodestonePage() {
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [meta, setMeta] = useState('');

  const run = async (file?: File) => {
    if (!file) return;
    setErr('');
    setEmbed('');
    setMeta(`${file.name} · ${pretty(file.size)}`);
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap, but large files make encode feel sleepy.' : '');
    setBusy(true);
    try {
      const dataUrl = await card(file);
      setPreview(dataUrl);
      const id = uid();
      const res = await publishShare({
        id,
        name: `lodestone-${file.name.replace(/[^a-z0-9._-]+/gi, '-')}.jpg`,
        type: 'image/jpeg',
        size: Math.floor((dataUrl.length * 3) / 4),
        dataUrl,
        author: 'lodestone',
      });
      if (!res.ok) throw new Error(res.error || 'lodestone failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">lodestone</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pull a file into a 1200×630 card.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            the original stays on device. only the painted card goes to the share db so discord unfurls cleanly.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); run(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => run(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'painting…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. we only warn if the tab might lag.</p>
          </label>
          {meta && <p className="text-xs text-neutral-500 mt-4">{meta}</p>}
          {preview && <img src={preview} alt="lodestone card" className="mt-5 rounded-2xl w-full" />}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 break-all mt-4">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
