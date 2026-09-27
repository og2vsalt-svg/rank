import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function SkylightPage() {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [embed, setEmbed] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const raw = id.trim().replace(/^.*[?#]f=/, '').replace(/^.*\/s\//, '');
    if (!raw) return;
    setBusy(true);
    setErr('');
    try {
      const meta = await fetchShare(raw);
      if (!meta) {
        setErr('could not find that drop');
        return;
      }
      const urls = shareUrls(meta.id);
      setTitle(meta.name);
      setDesc(`${meta.type || 'file'} · ${Math.round((meta.size || 0) / 1024) || 1} kb · public drop on rankvault`);
      setEmbed(urls.embed);
    } catch (e: any) {
      setErr(e?.message || 'preview failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">skylight</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">see the discord card first.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id or /s link. we mock the embed so you know it looks clean before you drop it in a server.</p>
          <div className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="id or /s/abc"
              className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <button onClick={load} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'looking…' : 'preview'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 rounded-2xl overflow-hidden border border-[#5865f2]/30 bg-[#2b2d31]"
            >
              <div className="h-1 bg-[#0a84ff]" />
              <div className="p-4">
                <p className="text-[11px] text-[#00a8fc] font-medium">rankvault</p>
                <p className="text-white text-[15px] font-semibold mt-1">{title}</p>
                <p className="text-[#dbdee1] text-[13px] mt-1">{desc}</p>
                <p className="text-[11px] text-[#949ba4] mt-3 break-all">{embed}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
