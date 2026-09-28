import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function FiligreePage() {
  const [text, setText] = useState('quietly hosted');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const svg = useMemo(() => {
    const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 80);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0a84ff"/><stop offset="1" stop-color="#af52de"/></linearGradient></defs><rect width="1200" height="630" fill="#050506"/><circle cx="180" cy="120" r="220" fill="url(#g)" opacity="0.35"/><circle cx="1040" cy="540" r="260" fill="url(#g)" opacity="0.22"/><text x="80" y="340" fill="#f5f5f7" font-family="Inter, Helvetica, sans-serif" font-size="54" font-weight="600">${safe}</text><text x="80" y="390" fill="#8e8e93" font-family="Inter, Helvetica, sans-serif" font-size="22">rankvault drop</text></svg>`;
  }, [text]);

  const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  const publish = async () => {
    setBusy(true);
    setErr('');
    try {
      const id = 'fil-' + Date.now().toString(36);
      const res = await publishShare({
        id,
        name: 'filigree.svg',
        type: 'image/svg+xml',
        size: svg.length,
        dataUrl,
      });
      if (!res.ok) { setErr(res.error || 'failed'); return; }
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">filigree</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">turn a line into a card.</h1>
          <p className="text-neutral-400 text-sm mb-6">renders an svg poster in the tab, then stores it on the share db. discord unfurls /s.</p>
          <input value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 mb-5" />
          <div className="rounded-2xl overflow-hidden mb-5 bg-black">
            <img src={dataUrl} alt="" className="w-full" />
          </div>
          <button onClick={publish} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'publishing…' : 'publish poster'}</button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && <p className="text-xs text-neutral-500 mt-3 break-all">{link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
