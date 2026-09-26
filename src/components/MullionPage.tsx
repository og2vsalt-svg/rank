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

export default function MullionPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState('');
  const [info, setInfo] = useState<{ name: string; type: string; size: number } | null>(null);
  const [embed, setEmbed] = useState('');

  const send = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setEmbed('');
    setInfo({ name: file.name, type: file.type || 'application/octet-stream', size: file.size });
    setWarn(file.size > 40 * 1024 * 1024 ? 'preview of a huge file can stutter. still no cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') || file.type.startsWith('text/') ? dataUrl : '');
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setEmbed(shareUrls(id).embed);
      try { await navigator.clipboard.writeText(shareUrls(id).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'mullion cracked');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">mullion</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview on one pane. share on the other.</h1>
          <p className="text-neutral-400 text-sm mb-6">inspect a local file, then publish it. discord gets the /s card.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'splitting the pane…' : 'drop a file between the mullions'}</p>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 min-h-[140px]">
              <p className="text-xs text-neutral-500 mb-2">pane</p>
              {preview.startsWith('data:image') && <img src={preview} alt="" className="rounded-xl max-h-48 object-contain mx-auto" />}
              {preview.startsWith('data:audio') && <audio controls src={preview} className="w-full" />}
              {preview.startsWith('data:video') && <video controls src={preview} className="w-full rounded-xl max-h-48" />}
              {!preview && <p className="text-sm text-neutral-500">no inline preview for this type. metadata still works.</p>}
            </div>
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 min-h-[140px]">
              <p className="text-xs text-neutral-500 mb-2">facts</p>
              {info ? (
                <>
                  <p className="text-sm text-white break-all">{info.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{info.type}</p>
                  <p className="text-xs text-neutral-500">{info.size} bytes</p>
                </>
              ) : (
                <p className="text-sm text-neutral-500">waiting on a file.</p>
              )}
            </div>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 break-all mt-4">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
