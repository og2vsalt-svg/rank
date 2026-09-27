import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function LookoutPage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [card, setCard] = useState<{ title: string; desc: string; embed: string; app: string } | null>(null);
  const [copied, setCopied] = useState('');

  const run = async () => {
    const clean = id.trim();
    if (!clean) return;
    setBusy(true);
    setErr('');
    setCard(null);
    try {
      const meta = await fetchShare(clean);
      const urls = shareUrls(clean);
      if (!meta) {
        setErr('no live share under that id. embed url still works for bots, but the card will be generic.');
        setCard({
          title: 'rankvault drop',
          desc: 'a quiet file drop. open to download.',
          embed: urls.embed,
          app: urls.app,
        });
        return;
      }
      setCard({
        title: meta.name,
        desc: `${meta.type || 'file'} · ${meta.size} bytes${meta.author ? ' · ' + meta.author : ''}`,
        embed: urls.embed,
        app: urls.app,
      });
    } catch {
      setErr('could not reach the share db.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 1400);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lookout</p>
          <h1 className="text-3xl font-semibold mb-3">preview the discord card.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. we pull the title discord will show on /s/id.</p>
          <div className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id"
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <button onClick={run} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'looking…' : 'look'}</button>
          </div>
          {err && <p className="text-xs text-amber-300/80 mt-4">{err}</p>}
          {card && (
            <div className="mt-6 rounded-[24px] overflow-hidden border border-[#5865F2]/30">
              <div className="h-1.5 bg-[#5865F2]" />
              <div className="p-5 bg-[#1e1f22]">
                <p className="text-[11px] text-[#b5bac1] mb-1">rankvault</p>
                <p className="text-[#00a8fc] font-medium">{card.title}</p>
                <p className="text-[#dbdee1] text-sm mt-1">{card.desc}</p>
                <p className="text-[11px] text-[#949ba4] mt-3 break-all">{card.embed}</p>
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-2 bg-white/[0.03]">
                <button onClick={() => copy(card.embed, 'embed')} className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium">copy /s embed</button>
                <button onClick={() => copy(card.app, 'app')} className="px-4 py-2 rounded-full bg-white/8 text-xs">copy app link</button>
                <button onClick={() => copy(`[${card.title}](${card.embed})`, 'md')} className="px-4 py-2 rounded-full bg-white/8 text-xs">copy markdown</button>
                {copied && <span className="text-xs text-neutral-500 self-center">{copied} copied</span>}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
