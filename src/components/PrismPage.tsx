import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function PrismPage() {
  const [src, setSrc] = useState('');
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr('');
    setLink('');
    setName(file.name);
    setWarn(file.size > 40 * 1024 * 1024 ? 'huge audio. decode might stutter a bit. no cap.' : '');
    const url = URL.createObjectURL(file);
    setSrc(url);
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'audio/mpeg',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'cloud publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setLink(shareUrls(id).embed);
    } catch (e: any) {
      setErr(e?.message || 'drop failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">prism</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop audio. listen here. share the card.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just a quiet player that publishes the file so discord can unfurl it.</p>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 py-10 text-sm text-neutral-300 transition"
          >
            {busy ? 'publishing…' : 'pick an audio file'}
          </button>
          {src && (
            <motion.audio
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              controls
              src={src}
              className="w-full mt-6"
            />
          )}
          {name && <p className="text-xs text-neutral-500 mt-3">{name}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && (
            <p className="text-xs text-neutral-400 mt-3 break-all">discord link: {link}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
