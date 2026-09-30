import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function HalyardPage() {
  const [signal, setSignal] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const hoist = async () => {
    setErr('');
    const body = signal.trim();
    if (!body) {
      setErr('nothing to hoist');
      return;
    }
    const text = `halyard\nraised ${new Date().toISOString()}\n\n${body}\n`;
    const file = new File([text], 'halyard.txt', { type: 'text/plain' });
    setWarn(file.size > 2 * 1024 * 1024 ? 'heavy flag. the tab may feel slow. no cap.' : '');
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
        type: file.type,
        size: file.size,
        dataUrl,
        author: 'halyard',
      });
      if (!res.ok) throw new Error(res.error || 'hoist failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'hoist failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">halyard</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hoist a signal to the yard.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. a short flag with a timestamp, published to the share db.
          </p>
          <textarea
            value={signal}
            rows={6}
            placeholder="what to raise"
            onChange={(e) => setSignal(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-3xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40 resize-none mb-5"
          />
          <button
            disabled={busy}
            onClick={hoist}
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'hoisting…' : 'raise flag'}
          </button>
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>discord (copied): {embed}</p>
              <p>app: {app}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
