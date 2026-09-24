import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ConduitPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [name, setName] = useState('');
  const [over, setOver] = useState(false);

  const send = async (file?: File) => {
    if (!file) return;
    setName(file.name);
    setWarn(file.size > 20 * 1024 * 1024 ? 'chunky file. encoding might make the tab hitch. no cap tho.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'conduit',
      });
      if (!res.ok) {
        setErr(res.error || 'cloud write failed');
        return;
      }
      const urls = shareUrls(res.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'conduit failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">conduit</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">skip the vault. dump straight to the db.</h1>
          <p className="text-neutral-400 text-sm mb-6">local file → supabase public_shares. paste the /s/id link in discord for a real card.</p>
          <label
            className={`block cursor-pointer rounded-[24px] border border-dashed p-10 text-center transition ${over ? 'border-[#0a84ff] bg-[#0a84ff]/10' : 'border-white/15 hover:border-[#0a84ff]/50'}`}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); send(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'pushing to cloud…' : over ? 'drop it' : 'click or drag a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p className="text-sm text-white">{name}</p>
              <p>app: {link}</p>
              <p>discord card: {embed} <span className="text-neutral-500">(copied)</span></p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
