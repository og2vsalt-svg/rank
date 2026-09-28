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

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function StillroomPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const pick = async (next?: File) => {
    if (!next) return;
    setFile(next);
    setErr('');
    setEmbed('');
    setApp('');
    setWarn(next.size > 40 * 1024 * 1024 ? 'no cap. this size can make the tab feel sleepy while it encodes.' : '');
    if (next.type.startsWith('image/') || next.type.startsWith('audio/') || next.type.startsWith('video/')) {
      setPreview(URL.createObjectURL(next));
    } else {
      setPreview('');
    }
  };

  const ship = async () => {
    if (!file) {
      setErr('drop something first');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = crypto.randomUUID().slice(0, 10);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'stillroom failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">stillroom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">look at a file, then send it public.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            preview images, audio, or video locally. when you are ready it hits the share db and you get a discord /s card.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files?.[0]);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">{file ? file.name : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {file && (
            <p className="text-xs text-neutral-500 mt-4">
              {pretty(file.size)} · {file.type || 'unknown'}
            </p>
          )}
          {preview && file?.type.startsWith('image/') && (
            <img src={preview} alt="" className="mt-5 w-full max-h-72 object-contain rounded-2xl bg-black/30" />
          )}
          {preview && file?.type.startsWith('audio/') && (
            <audio src={preview} controls className="mt-5 w-full" />
          )}
          {preview && file?.type.startsWith('video/') && (
            <video src={preview} controls className="mt-5 w-full rounded-2xl max-h-72 bg-black/40" />
          )}
          <button
            onClick={ship}
            disabled={busy || !file}
            className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'distilling…' : 'publish drop'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
