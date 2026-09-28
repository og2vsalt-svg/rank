import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fireText(raw: string) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export default function KilnPage() {
  const [raw, setRaw] = useState('');
  const [fired, setFired] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [warn, setWarn] = useState('');

  const bake = () => {
    setFired(fireText(raw));
    setErr('');
  };

  const ship = async () => {
    const body = fired || fireText(raw);
    if (!body) {
      setErr('nothing to fire.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([body], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: `kiln-${id}.txt`,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'kiln',
      });
      if (!res.ok) throw new Error(res.error || 'kiln failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      setWarn(res.warn || (blob.size > 40 * 1024 * 1024 ? 'large note. preview clients may feel slow.' : ''));
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not ship');
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
          <p className="text-[#0a84ff] text-sm mb-2">kiln</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">fire loose text until it sits still.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. collapse extra space locally, then optionally publish a .txt drop with a discord /s card.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={8}
            placeholder="paste notes, dumps, lyrics…"
            className="w-full rounded-2xl bg-black/30 border border-white/10 text-sm text-neutral-200 p-4 outline-none focus:border-[#0a84ff]/50 transition"
          />
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={bake} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">fire locally</button>
            <button onClick={ship} disabled={busy} className="px-4 py-2 rounded-full glass text-sm text-neutral-200">
              {busy ? 'shipping…' : 'publish drop'}
            </button>
          </div>
          {fired && (
            <pre className="mt-5 text-xs text-neutral-400 whitespace-pre-wrap break-words">{fired}</pre>
          )}
          {(raw || fired) && (
            <p className="text-xs text-neutral-500 mt-3">
              raw {pretty(raw.length)} · fired {pretty((fired || fireText(raw)).length)}
            </p>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-5 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
