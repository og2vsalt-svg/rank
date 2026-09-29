import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function SkeinPage() {
  const [lines, setLines] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const wind = async () => {
    const parts = lines
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) {
      setErr('add at least one line');
      return;
    }
    const body = parts.map((p, i) => `${String(i + 1).padStart(2, '0')}  ${p}`).join('\n');
    setErr('');
    setBusy(true);
    setWarn(body.length > 400_000 ? 'long skein. the tab may feel slow.' : '');
    try {
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = uid();
      const pub = await publishShare({
        id,
        name: 'skein.txt',
        type: 'text/plain',
        size: new Blob([body]).size,
        dataUrl,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'skein failed');
    } finally {
      setBusy(false);
    }
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
          <p className="text-[#0a84ff] text-sm mb-2">skein</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">wind loose lines into one drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">each line is numbered, then published as a single .txt with a discord card.</p>
          <textarea
            value={lines}
            onChange={(e) => setLines(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 rounded-3xl bg-white/5 border border-white/10 text-sm outline-none resize-y min-h-[160px]"
            placeholder="one thought per line"
          />
          <button
            onClick={wind}
            disabled={busy}
            className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'winding…' : 'wind and publish'}
          </button>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {link && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>app: {link}</p>
              <p>discord embed (copied): {embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
