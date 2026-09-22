import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function IvoryPage() {
  const { navigate } = useRouter();
  const [id, setId] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const share = id.trim() ? `${origin}/s/${id.trim()}` : '';
  const hash = id.trim() ? `${origin}/#share?f=${id.trim()}` : '';

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
          <p className="text-[#0a84ff] text-sm mb-2">ivory</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">discord-ready share cards.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a drop id. copy the /s/ link so discord, slack, and twitter pick up the embed.</p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id"
            className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          {share && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">embed link</p>
              <p className="text-sm break-all text-white">{share}</p>
              <p className="text-xs text-neutral-500">app hash</p>
              <p className="text-sm break-all text-neutral-300">{hash}</p>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(share)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy embed</button>
                <button onClick={() => navigate('share', id.trim())} className="px-4 py-2 rounded-full bg-white/10 text-sm">open drop</button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#2b2d31]">
                <div className="h-1 bg-[#0a84ff]" />
                <div className="p-4">
                  <p className="text-[#00a8fc] text-sm font-medium">rankvault</p>
                  <p className="text-white text-base mt-1">{id.trim()} — rankvault</p>
                  <p className="text-[#dbdee1] text-sm mt-1">quiet public drop. open to download.</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
