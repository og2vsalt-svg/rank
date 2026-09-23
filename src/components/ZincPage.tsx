import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function ZincPage() {
  const { navigate } = useRouter();
  const [id, setId] = useState('');
  const clean = id.trim().replace(/^#?(share\?f=)?/, '');

  const embedPath = clean ? `/s/${encodeURIComponent(clean)}?embed=1` : '';
  const discordLink = clean ? `${window.location.origin}/s/${encodeURIComponent(clean)}` : '';

  const copy = async () => {
    if (!discordLink) return;
    try {
      await navigator.clipboard.writeText(discordLink);
    } catch {}
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
          <p className="text-[#0a84ff] text-sm mb-2">zinc</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview the discord card.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. we hit the same /s route discord unfurls, so you can see if the embed looks pro before you drop it in a channel.</p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id"
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 mb-4"
          />
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={copy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">copy /s link</button>
            <button onClick={() => clean && navigate('share', clean)} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">open share</button>
          </div>
          {embedPath && (
            <iframe
              title="embed preview"
              src={embedPath}
              className="w-full h-56 rounded-2xl border border-white/10 bg-black"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
