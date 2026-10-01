import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function RondelPage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const poem = [a, b, c, a, b, a].map((line) => line.trim()).filter(Boolean).join('\n');

  const publish = async () => {
    if (!poem) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(poem + '\n')}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: 'rondel.txt',
        type: 'text/plain',
        size: new Blob([poem]).size,
        dataUrl,
        author: 'rondel',
      });
      if (!res.ok) throw new Error(res.error || 'rondel broke');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">rondel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">three lines that return.</h1>
          <p className="text-neutral-400 text-sm mb-6">a small repeating form. we weave A B C A B A in the tab, then hang the poem as a public drop. discord unfurls /s.</p>
          <input value={a} onChange={(e) => setA(e.target.value)} placeholder="line A — the refrain" className="w-full mb-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <input value={b} onChange={(e) => setB(e.target.value)} placeholder="line B" className="w-full mb-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <input value={c} onChange={(e) => setC(e.target.value)} placeholder="line C" className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap mb-5 min-h-[5rem]">{poem || 'the circle is empty.'}</pre>
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={publish} disabled={busy || !poem} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'closing the circle…' : 'publish rondel'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
