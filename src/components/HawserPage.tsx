import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function HawserPage() {
  const [ids, setIds] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const braid = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = ids
      .split(/[\s,]+/)
      .map((s) => s.trim().replace(/^.*[\/=]/, ''))
      .filter(Boolean);
    if (!list.length) return;
    setBusy(true);
    setErr('');
    setEmbed('');
    try {
      const origin = window.location.origin;
      const body = ['rankvault hawser', ...list.map((id) => `${origin}/s/${id}`)].join('\n');
      const file = new File([body], 'hawser.txt', { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = 'haws-' + uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        author: 'hawser',
      });
      if (!res.ok) throw new Error(res.error || 'could not braid');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'hawser failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">hawser</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">braid existing drop ids into one line.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            paste share ids. we publish a plain list of discord /s links as a new public drop.
          </p>
          <form onSubmit={braid}>
            <textarea
              value={ids}
              onChange={(e) => setIds(e.target.value)}
              rows={6}
              placeholder="one id per line"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
            >
              {busy ? 'braiding…' : 'publish hawser'}
            </button>
          </form>
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
