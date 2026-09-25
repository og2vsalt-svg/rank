import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function SpurPage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const lookup = async () => {
    const clean = id.trim();
    if (!clean) {
      setErr('paste a share id');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const row = await fetchShare(clean);
      if (!row) {
        setErr('nothing live for that id');
        setName('');
        return;
      }
      setName(row.name);
      setSize(row.size);
      const urls = shareUrls(row.id);
      setEmbed(urls.embed);
      setApp(urls.app);
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">spur</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">look up a live drop without opening it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            paste an id from the share db. we pull metadata and hand you the discord /s card again.
          </p>
          <div className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id"
              className="flex-1 rounded-full bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/40"
            />
            <button
              onClick={lookup}
              disabled={busy}
              className="rounded-full bg-white text-black px-5 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50"
            >
              {busy ? '…' : 'peek'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {name && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
              <p className="text-sm text-white truncate">{name}</p>
              <p className="text-xs text-neutral-500 mt-1">{size} bytes</p>
              {embed && <p className="text-xs text-neutral-400 break-all mt-2">{embed}</p>}
              {app && <p className="text-xs text-neutral-500 break-all mt-1">{app}</p>}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
