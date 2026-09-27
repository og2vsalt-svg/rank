import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function IngressPage() {
  const [name, setName] = useState('paste.txt');
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    setErr('');
    setBusy(true);
    try {
      let dataUrl = raw.trim();
      let type = 'text/plain';
      let size = raw.length;
      if (!dataUrl.startsWith('data:')) {
        const blob = new Blob([raw], { type: 'text/plain' });
        size = blob.size;
        dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('encode failed'));
          r.readAsDataURL(blob);
        });
      } else {
        const head = dataUrl.slice(5, dataUrl.indexOf(','));
        type = head.split(';')[0] || 'application/octet-stream';
        size = Math.floor(((dataUrl.split(',')[1] || '').length * 3) / 4);
      }
      if (size > 40 * 1024 * 1024) setWarn('chunky paste. the tab might nap a bit. no hard limit.');
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, size, dataUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'ingress failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (json.warn) setWarn(json.warn);
    } catch (e: any) {
      setErr(e?.message || 'ingress failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">ingress</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">paste text or a data url. it becomes a drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">handy when the file is already sitting in your clipboard as raw bytes.</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
            placeholder="filename"
          />
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-mono outline-none focus:border-[#0a84ff]/50 resize-y min-h-[12rem]"
            placeholder="plain text or data:..."
          />
          <button
            onClick={publish}
            disabled={busy || !raw.trim()}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'pouring…' : 'send into the db'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
