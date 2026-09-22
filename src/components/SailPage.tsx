import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function SailPage() {
  const { navigate } = useRouter();
  const [id, setId] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embed = id.trim() ? `${origin}/s/${id.trim()}` : '';
  const pageEmbed = id.trim() && !id.includes('-') ? `${origin}/p/${id.trim()}` : '';

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
          <p className="text-[#0a84ff] text-sm mb-2">sail</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">make the discord card look finished.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            bots scrape /s/id and /p/page. paste a share id or a desk name. copy the embed url, not the hash route.
          </p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id or desk name like vault"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-5"
          />
          {embed && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">file embed</p>
                <p className="text-sm break-all text-white">{embed}</p>
              </div>
              {pageEmbed && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">page embed</p>
                  <p className="text-sm break-all text-white">{pageEmbed}</p>
                </div>
              )}
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#2b2d31]">
                <div className="h-1 bg-[#0a84ff]" />
                <div className="p-4 flex gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#00a8fc] text-sm font-medium">rankvault</p>
                    <p className="text-white text-base mt-1 truncate">{id.trim()} — rankvault</p>
                    <p className="text-[#dbdee1] text-sm mt-1">quiet file hosting and side desks. share only if you want.</p>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-[#0a84ff]/20 shrink-0" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigator.clipboard.writeText(embed)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy /s/ link</button>
                {pageEmbed && (
                  <button onClick={() => navigator.clipboard.writeText(pageEmbed)} className="px-4 py-2 rounded-full bg-white/10 text-sm">copy /p/ link</button>
                )}
                <button onClick={() => navigate('share', id.trim())} className="px-4 py-2 rounded-full bg-white/10 text-sm">open as drop</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
