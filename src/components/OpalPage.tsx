import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function OpalPage() {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('quiet drop');
  const [copied, setCopied] = useState('');

  const urls = useMemo(() => {
    const clean = id.trim();
    if (!clean) return null;
    return shareUrls(clean);
  }, [id]);

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
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
          <p className="text-[#0a84ff] text-sm mb-2">opal</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">discord card preview.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            paste a share id. copy the /s/ link so discord, slack, and imessage pick up the og tags.
          </p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-3"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="card title"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-6"
          />
          <div className="rounded-[24px] overflow-hidden border border-white/10 bg-[#111214]">
            <div className="h-36 bg-gradient-to-br from-[#0a84ff]/40 via-[#1c1c1e] to-black" />
            <div className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#0a84ff]">rankvault</p>
              <p className="text-white font-medium mt-1">{title || 'quiet drop'}</p>
              <p className="text-xs text-neutral-500 mt-1">file hosting · no hard cap, just slowness warnings</p>
            </div>
          </div>
          {urls && (
            <div className="mt-6 space-y-2">
              <button onClick={() => copy(urls.embed)} className="w-full px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
                copy discord embed url
              </button>
              <button onClick={() => copy(urls.app)} className="w-full px-5 py-2.5 rounded-full bg-white/5 text-sm">
                copy in-app share url
              </button>
            </div>
          )}
          {copied && <p className="text-xs text-neutral-500 mt-4 break-all">{copied}</p>}
        </motion.div>
      </div>
    </div>
  );
}
