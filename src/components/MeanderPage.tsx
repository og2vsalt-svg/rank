import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
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

export default function MeanderPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [meta, setMeta] = useState<{ w: number; h: number; size: number; name: string; warn?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const onFile = async (picked: File) => {
    setFile(picked);
    setEmbed('');
    setErr('');
    const warn =
      picked.size > 40 * 1024 * 1024
        ? 'large still. preview and publish may feel slow. no hard cap.'
        : picked.size > 8 * 1024 * 1024
          ? 'chunky still. give the tab a second.'
          : undefined;
    const url = URL.createObjectURL(picked);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setMeta({ w: img.naturalWidth, h: img.naturalHeight, size: picked.size, name: picked.name, warn });
    };
    img.onerror = () => {
      setMeta({ w: 0, h: 0, size: picked.size, name: picked.name, warn });
    };
    img.src = url;
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = `meander-${Date.now().toString(36)}`;
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: meta ? `${meta.w}x${meta.h}` : 'meander',
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish to the share db');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">meander</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">look at a still. ship it if it sits right.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            local preview with width and height. nothing leaves until you publish. discord unfurls the /s card.
          </p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <span className="text-sm text-neutral-300">choose a still</span>
          </label>
          {preview && (
            <img src={preview} alt="" className="mt-6 w-full rounded-2xl object-contain max-h-80 bg-black/30" />
          )}
          {meta && (
            <div className="mt-5 space-y-2 text-sm text-neutral-300">
              <p><span className="text-neutral-500">name</span> {meta.name}</p>
              <p><span className="text-neutral-500">frame</span> {meta.w} × {meta.h}</p>
              <p><span className="text-neutral-500">size</span> {pretty(meta.size)}</p>
              {meta.warn && <p className="text-amber-400/80 text-xs pt-1">{meta.warn}</p>}
              <button disabled={busy} onClick={publish} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
                {busy ? 'publishing…' : 'publish to share db'}
              </button>
            </div>
          )}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="mt-4 text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
