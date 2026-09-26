import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function KetchPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const send = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setEmbed('');
    setApp('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky file. encoding might feel sleepy. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(file.type.startsWith('image/') ? dataUrl : '');
      const name = caption.trim() ? `${caption.trim().slice(0, 48)}-${file.name}` : file.name;
      const id = uid();
      const res = await publishShare({
        id,
        name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: caption.trim() || undefined,
      });
      if (!res.ok) {
        setErr(res.error || 'ketch missed the wind');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'ketch stayed docked');
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
          <p className="text-[#0a84ff] text-sm mb-2">ketch</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">caption a file, then sail it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            write a short line, drop one file, land it on the share db. discord gets a /s card.
          </p>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="caption for the drop"
            className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/40"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'sailing…' : 'drop one file on the ketch'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. we only tap you if the tab might lag.</p>
          </label>
          {preview && (
            <img src={preview} alt="" className="mt-5 rounded-2xl max-h-56 object-contain mx-auto" />
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app link: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
