import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function waveformCard(file: File): Promise<{ dataUrl: string; peaks: number[] }> {
  const ctx = new AudioContext();
  const buf = await file.arrayBuffer();
  const audio = await ctx.decodeAudioData(buf.slice(0));
  const ch = audio.getChannelData(0);
  const buckets = 220;
  const step = Math.max(1, Math.floor(ch.length / buckets));
  const peaks: number[] = [];
  for (let i = 0; i < buckets; i++) {
    let max = 0;
    const start = i * step;
    for (let j = 0; j < step && start + j < ch.length; j++) {
      const v = Math.abs(ch[start + j]);
      if (v > max) max = v;
    }
    peaks.push(max);
  }
  await ctx.close();

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const g = canvas.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 1200, 630);
  grd.addColorStop(0, '#050506');
  grd.addColorStop(1, '#0b1b33');
  g.fillStyle = grd;
  g.fillRect(0, 0, 1200, 630);
  g.fillStyle = 'rgba(245,245,247,0.92)';
  g.font = '600 28px Inter, system-ui, sans-serif';
  g.fillText('oscillo', 64, 86);
  g.fillStyle = 'rgba(161,161,170,0.95)';
  g.font = '400 20px Inter, system-ui, sans-serif';
  g.fillText(file.name.slice(0, 54), 64, 122);
  g.fillText(`${audio.duration.toFixed(1)}s · ${audio.sampleRate} hz`, 64, 154);

  const mid = 360;
  const h = 220;
  g.beginPath();
  peaks.forEach((p, i) => {
    const x = 64 + (i / (peaks.length - 1)) * 1072;
    const y = mid - p * h;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  });
  for (let i = peaks.length - 1; i >= 0; i--) {
    const x = 64 + (i / (peaks.length - 1)) * 1072;
    const y = mid + peaks[i] * h;
    g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = 'rgba(10,132,255,0.28)';
  g.fill();
  g.strokeStyle = 'rgba(10,132,255,0.9)';
  g.lineWidth = 2;
  g.stroke();

  return { dataUrl: canvas.toDataURL('image/jpeg', 0.92), peaks };
}

export default function OscilloPage() {
  const [preview, setPreview] = useState('');
  const [embed, setEmbed] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [msg, setMsg] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMsg('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'large audio. decode may feel slow. no cap.' : '');
    try {
      const card = await waveformCard(file);
      setPreview(card.dataUrl);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name.replace(/\.[^.]+$/, '') + '-oscillo.jpg',
        type: 'image/jpeg',
        size: Math.round((card.dataUrl.length * 3) / 4),
        dataUrl: card.dataUrl,
        author: 'oscillo',
      });
      if (!res.ok) {
        setMsg(res.error || 'could not land the card');
      } else {
        setEmbed(shareUrls(res.id || id).embed);
        setMsg('waveform card is in the share db. discord will unfurl /s.');
        if (res.warn) setWarn(res.warn);
      }
    } catch (e: any) {
      setMsg(e?.message || 'could not read that audio');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">oscillo</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">turn a clip into a wave card.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. decode audio in the tab, paint a still, then publish that still to the share table so discord gets a real image embed.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'drawing…' : 'drop an audio file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. huge files just feel sleepy.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {msg && <p className="text-xs text-neutral-400 mt-4">{msg}</p>}
          {preview && <img src={preview} alt="" className="mt-6 w-full rounded-2xl" />}
          {embed && <p className="text-xs text-neutral-500 mt-4 break-all">discord link: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
