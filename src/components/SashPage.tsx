import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function SashPage() {
  const [preview, setPreview] = useState<{ url: string; kind: string; name: string; size: number; file: File } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const pick = (file?: File) => {
    if (!file) return;
    if (preview?.url) URL.revokeObjectURL(preview.url);
    const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file';
    setPreview({ url: URL.createObjectURL(file), kind, name: file.name, size: file.size, file });
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap. preview + encode on a file this size can lag the tab.' : '');
    setErr('');
    setEmbed('');
  };

  const publish = async () => {
    if (!preview) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(preview.file);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preview.name,
          type: preview.file.type || 'application/octet-stream',
          size: preview.size,
          dataUrl,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'publish failed');
      const urls = shareUrls(json.id);
      setEmbed(urls.embed);
      if (json.warn) setWarn(json.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'sash failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">sash</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview, then publish.</h1>
          <p className="text-neutral-400 text-sm mb-6">look at the media in-tab. if it feels right, send it to the share db. discord still uses /s.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}>
            <input type="file" accept="image/*,video/*,audio/*,*/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            <p className="text-white font-medium">pick a file</p>
          </label>
          {preview && (
            <div className="mt-5 space-y-3">
              {preview.kind === 'image' && <img src={preview.url} alt="" className="w-full rounded-2xl max-h-72 object-contain bg-black/30" />}
              {preview.kind === 'video' && <video src={preview.url} controls className="w-full rounded-2xl max-h-72 bg-black/30" />}
              {preview.kind === 'audio' && <audio src={preview.url} controls className="w-full" />}
              <p className="text-xs text-neutral-500">{preview.name} · {pretty(preview.size)}</p>
              <button onClick={publish} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'publishing…' : 'publish drop'}</button>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 break-all mt-3">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
