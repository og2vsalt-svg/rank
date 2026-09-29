import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function MullionPage() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [embed, setEmbed] = useState('');

  const panes = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

  const ship = async () => {
    setErr('');
    if (!text.trim()) {
      setErr('write something first');
      return;
    }
    setBusy(true);
    try {
      const body = panes.map((p, i) => `[${i + 1}]\n${p}`).join('\n\n');
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: `mullion-${id}.txt`,
        type: 'text/plain',
        size: body.length,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'mullion failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'mullion failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">mullion</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">split a note into panes, then ship one file.</h1>
          <p className="text-neutral-400 text-sm mb-6">blank lines become window bars. not a vault. discord still gets a /s card.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="pane one\n\npane two"
            className="w-full mb-3 px-4 py-3 rounded-3xl bg-white/5 border border-white/10 text-sm outline-none resize-y"
          />
          <p className="text-xs text-neutral-500 mb-4">{panes.length} pane{panes.length === 1 ? '' : 's'}</p>
          <button onClick={ship} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'setting glass…' : 'publish panes'}</button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
