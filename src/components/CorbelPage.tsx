import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return '—';
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}

export default function CorbelPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [src, setSrc] = useState('');

  const listen = async (file?: File) => {
    if (!file) return;
    setErr('');
    setInfo('');
    if (src) URL.revokeObjectURL(src);
    setSrc('');
    setWarn(file.size > 80 * 1024 * 1024 ? 'no cap. a large sound file can make the tab feel sleepy while it loads.' : '');
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      setErr('drop a sound or a moving picture so we can time it.');
      return;
    }
    setBusy(true);
    try {
      const url = URL.createObjectURL(file);
      setSrc(url);
      const el = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
      el.preload = 'metadata';
      await new Promise<void>((resolve, reject) => {
        el.onloadedmetadata = () => resolve();
        el.onerror = () => reject(new Error('could not read media'));
        el.src = url;
      });
      setInfo([file.name, file.type || 'unknown', pretty(file.size), fmt(el.duration)].join(' · '));
    } catch (e: any) {
      setErr(e?.message || 'corbel failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">corbel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lean a sound file against the wall and time it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            stays local. duration, type, size. play it here if you want. nothing is uploaded.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); listen(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => listen(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">{busy ? 'listening…' : 'drop a sound'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {info && <p className="text-xs text-neutral-300 mt-4">{info}</p>}
          {src && (
            <audio controls src={src} className="mt-5 w-full" />
          )}
        </motion.div>
      </div>
    </div>
  );
}
