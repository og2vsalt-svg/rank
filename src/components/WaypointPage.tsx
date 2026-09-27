import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function WaypointPage() {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => {
    const clean = id.trim();
    if (!clean) return null;
    return shareUrls(clean);
  }, [id]);

  const load = async () => {
    const clean = id.trim();
    if (!clean) return;
    setBusy(true);
    try {
      const meta = await fetchShare(clean);
      if (meta) {
        setTitle(meta.name);
        setDesc(`${meta.type || 'file'} · ${meta.size} bytes${meta.author ? ' · ' + meta.author : ''}`);
      } else {
        setTitle('rankvault drop');
        setDesc('discord will still get a card. humans get sent into the app.');
      }
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
          <p className="text-[#0a84ff] text-sm mb-2">waypoint</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview the discord card for any drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. bots hit /s/id. people land in the app.</p>
          <div className="flex gap-2 mb-6">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id"
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
            />
            <button onClick={load} className="px-4 rounded-2xl bg-white text-black text-sm font-medium">
              {busy ? '…' : 'peek'}
            </button>
          </div>
          {preview && (
            <div className="rounded-[22px] overflow-hidden border border-white/10 bg-[#2b2d31]">
              <div className="flex">
                <div className="w-1 bg-[#0a84ff]" />
                <div className="flex-1 p-4">
                  <p className="text-[12px] text-[#0a84ff] font-medium">rankvault</p>
                  <p className="text-white text-sm font-semibold mt-1">{title || 'untitled drop'}</p>
                  <p className="text-[#dbdee1] text-[13px] mt-1">{desc || preview.embed}</p>
                  <p className="text-[11px] text-[#949ba4] mt-3 break-all">{preview.embed}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
