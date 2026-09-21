import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function code() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function SpirePage() {
  const [room, setRoom] = useState(code());
  const [status, setStatus] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (file: File) => {
    setBusy(true);
    setStatus(file.size > 40 * 1024 * 1024 ? 'large drop. upload may feel slow, no hard cap.' : 'sending to the cloud room…');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const res = await publishShare({
        id: `spire-${room.toLowerCase()}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'spire',
      });
      const urls = shareUrls(res.id);
      setLink(urls.embed);
      setStatus('live. drop this embed in discord and it looks clean.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not reach the share db');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">spire</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">room codes for one-shot drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">pick a six letter code, upload a local file, it lands in the public share db. same code overwrites the last drop.</p>
          <div className="flex gap-2 mb-5">
            <input value={room} onChange={(e) => setRoom(e.target.value.toUpperCase().slice(0, 8))} className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm tracking-[0.3em] text-center outline-none" />
            <button onClick={() => setRoom(code())} className="px-4 py-2.5 rounded-full bg-white/5 text-sm">new</button>
          </div>
          <label className={`block rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center text-sm text-neutral-400 cursor-pointer hover:border-white/30 transition-colors ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
            drop a file into room {room}
            <input type="file" className="hidden" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); }} />
          </label>
          {status && <p className="text-sm text-neutral-400 mt-5">{status}</p>}
          {link && (
            <p className="text-xs text-neutral-500 mt-2 break-all">
              discord embed: {link}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
