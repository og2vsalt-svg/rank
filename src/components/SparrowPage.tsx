import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function code() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error || new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function SparrowPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [pickup, setPickup] = useState('');
  const [embed, setEmbed] = useState('');
  const [id, setId] = useState('');

  const onFile = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'heavy file. the tab may pause while it encodes. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const pin = code();
      const shareId = 'sp-' + pin.toLowerCase();
      const res = await publishShare({
        id: shareId,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'pickup:' + pin,
      });
      if (!res.ok) {
        setErr(res.error || 'could not reach the share db');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setPickup(pin);
      setId(res.id || shareId);
      const urls = shareUrls(res.id || shareId);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'sparrow failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">sparrow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">say a six-letter code, not a url.</h1>
          <p className="text-neutral-400 text-sm mb-6">one local file goes to the share db. you get a short pickup code plus a discord /s card. not a vault grid.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'handing it across…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {pickup && (
            <div className="mt-8">
              <p className="text-xs text-neutral-500 mb-2">pickup code</p>
              <p className="text-4xl tracking-[0.28em] font-semibold text-white">{pickup}</p>
              <p className="text-xs text-neutral-500 mt-4 break-all">discord embed: {embed}</p>
              <p className="text-xs text-neutral-600 mt-1">share id {id}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
