import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function GiltPage() {
  const [id, setId] = useState('');
  const [card, setCard] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const clean = id.trim().replace(/^.*[/=]/, '');
    if (!clean) return;
    setBusy(true);
    setErr('');
    setCard('');
    try {
      const meta = await fetchShare(clean);
      if (!meta) {
        setErr('no live share with that id');
        return;
      }
      const urls = shareUrls(meta.id);
      const text = [
        meta.name,
        `${meta.type || 'file'} · ${Math.round((meta.size || 0) / 1024) || 1} kb`,
        urls.embed,
      ].join('\n');
      setCard(text);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'lookup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gilt</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">polish a discord card.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. we pull metadata and hand you the /s embed url that unfurls on discord.</p>
          <div className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id"
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/40"
            />
            <button onClick={run} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'looking…' : 'gilt'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {card && (
            <pre className="mt-5 text-xs text-neutral-300 whitespace-pre-wrap bg-white/[0.03] border border-white/8 rounded-2xl p-4">{card}</pre>
          )}
        </motion.div>
      </div>
    </div>
  );
}
