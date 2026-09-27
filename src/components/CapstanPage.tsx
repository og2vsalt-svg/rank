import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function CapstanPage() {
  const [id, setId] = useState('');
  const [copied, setCopied] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const urls = id.trim() ? shareUrls(id.trim()) : null;
  const extras = id.trim()
    ? {
        f: `${origin}/f/${encodeURIComponent(id.trim())}`,
        e: `${origin}/e/${encodeURIComponent(id.trim())}`,
        md: `[file](${origin}/s/${encodeURIComponent(id.trim())})`,
      }
    : null;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 1200);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">capstan</p>
          <h1 className="text-3xl font-semibold mb-3">spin every public link off one id.</h1>
          <p className="text-neutral-400 text-sm mb-6">/s is the discord embed. /f is the same card. /e forces the og html. hash link stays for humans.</p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id"
            className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          {urls && extras && (
            <div className="mt-6 space-y-2 text-sm">
              {[
                ['app', urls.app],
                ['discord /s', urls.embed],
                ['/f alias', extras.f],
                ['forced embed /e', extras.e],
                ['markdown', extras.md],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-neutral-500">{label}</p>
                    <p className="text-xs text-neutral-300 break-all">{value}</p>
                  </div>
                  <button onClick={() => copy(value, label)} className="shrink-0 text-xs text-[#0a84ff]">{copied === label ? 'copied' : 'copy'}</button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
