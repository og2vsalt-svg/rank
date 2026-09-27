import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function LoomcardPage() {
  const [id, setId] = useState('');
  const [copied, setCopied] = useState('');

  const urls = id.trim() ? shareUrls(id.trim()) : null;
  const md = urls ? `[drop](${urls.embed})` : '';
  const html = urls ? `<a href="${urls.embed}">rankvault drop</a>` : '';

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">loomcard</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">weave every embed path off one id.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            /s /f /e /g plus markdown. discord unfurls the short path, humans land in the app.
          </p>
          <input
            value={id}
            onChange={(e) => { setId(e.target.value); setCopied(''); }}
            placeholder="share id"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 mb-5"
          />
          {urls && (
            <div className="space-y-2 text-xs text-neutral-400">
              {[urls.embed, urls.embed.replace('/s/', '/f/'), urls.embed.replace('/s/', '/e/'), urls.app, md, html].map((line) => (
                <button
                  key={line}
                  onClick={() => copy(line, line)}
                  className="block w-full text-left break-all rounded-xl px-3 py-2 hover:bg-white/5"
                >
                  {line}
                </button>
              ))}
              {copied && <p className="text-neutral-500">copied</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
