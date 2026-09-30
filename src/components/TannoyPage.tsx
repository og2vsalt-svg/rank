import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function TannoyPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [meta, setMeta] = useState<{ name: string; size: number; type: string } | null>(null);
  const [embed, setEmbed] = useState('');
  const [peaks, setPeaks] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = async (file: File) => {
    setPeaks([]);
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i)) return;
    try {
      const buf = await file.arrayBuffer();
      const ctx = new AudioContext();
      const audio = await ctx.decodeAudioData(buf.slice(0));
      const data = audio.getChannelData(0);
      const buckets = 64;
      const step = Math.max(1, Math.floor(data.length / buckets));
      const next: number[] = [];
      for (let i = 0; i < buckets; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += Math.abs(data[i * step + j] || 0);
        next.push(Math.min(1, (sum / step) * 4));
      }
      setPeaks(next);
      const c = canvasRef.current;
      if (c) {
        const g = c.getContext('2d');
        if (g) {
          g.clearRect(0, 0, c.width, c.height);
          g.fillStyle = '#0a84ff';
          next.forEach((v, i) => {
            const h = Math.max(2, v * c.height);
            g.fillRect(i * (c.width / buckets) + 2, (c.height - h) / 2, c.width / buckets - 4, h);
          });
        }
      }
      await ctx.close();
    } catch {
      // still allow sharing if decode fails
    }
  };

  const publish = async (file: File) => {
    setErr('');
    setEmbed('');
    setMeta({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
    setWarn(file.size > 32 * 1024 * 1024 ? 'no cap. a file this heavy can make the tab feel slow.' : '');
    setBusy(true);
    await draw(file);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'tannoy',
      });
      if (!res.ok) throw new Error(res.error || 'tannoy failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      if (res.warn) setWarn(res.warn);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'tannoy failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">tannoy</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">listen to a local clip, then hang it on the public board.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. waveform stays in the tab. the original goes to the share db so discord can unfurl /s.
          </p>
          <canvas ref={canvasRef} width={640} height={96} className="w-full h-24 rounded-2xl bg-black/30 mb-5" />
          {peaks.length > 0 && (
            <p className="text-[11px] text-neutral-500 mb-4">{peaks.filter((p) => p > 0.2).length} loud bars · drawn locally</p>
          )}
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) publish(f);
            }}
          >
            <input type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && publish(e.target.files[0])} />
            <p className="text-white font-medium">{busy ? 'calling across the hall…' : 'drop audio or video'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size cap. only a slowness warning.</p>
          </label>
          {meta && <p className="text-xs text-neutral-500 mt-4">{meta.name} · {pretty(meta.size)}</p>}
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-xs text-neutral-400 break-all">
              discord (copied): {embed}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
