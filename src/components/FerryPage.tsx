import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, fetchShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function FerryPage() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [pull, setPull] = useState('');
  const [got, setGot] = useState<{ name: string; size: number; url: string } | null>(null);

  const send = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setMsg('');
    setWarn(file.size > 12 * 1024 * 1024 ? 'chunky file. no hard limit, just a slowness ping while it crosses.' : '');
    const id = `fy-${uid()}`;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('read failed'));
      r.readAsDataURL(file);
    });
    const res = await publishShare({
      id,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      dataUrl,
    });
    setBusy(false);
    if (!res.ok) {
      setMsg(res.error || 'could not park the file');
      return;
    }
    const urls = shareUrls(res.id || id);
    setCode(res.id || id);
    setLink(urls.app);
    setEmbed(urls.embed);
    setMsg('parked. give the other device the code or the embed link.');
    if (res.warn) setWarn(res.warn);
  };

  const receive = async () => {
    const id = pull.trim();
    if (!id) return;
    setBusy(true);
    setGot(null);
    const meta = await fetchShare(id);
    setBusy(false);
    if (!meta) {
      setMsg('nothing with that code. it may have expired.');
      return;
    }
    setGot({ name: meta.name, size: meta.size, url: meta.url });
    setMsg('found it.');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">
          ferry
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-semibold tracking-tight mb-3">
          hand a file to another device
        </motion.h1>
        <p className="text-neutral-400 text-sm mb-8">
          drop something here, get a short code. open ferry on the other side and type it. discord embeds use the same /s/ link.
        </p>
        <label className="glass block rounded-3xl p-8 text-center cursor-pointer mb-6">
          <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0] || null)} />
          <p className="text-white font-medium">{busy ? 'sending…' : 'drop or pick a file'}</p>
          <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
        </label>
        {code && (
          <div className="glass rounded-3xl p-5 mb-6">
            <p className="text-xs text-neutral-500 mb-1">code</p>
            <p className="text-2xl font-semibold tracking-[0.18em] text-white">{code}</p>
            <p className="text-xs text-neutral-500 mt-3 break-all">{embed}</p>
            <button className="mt-3 text-sm text-[#0a84ff]" onClick={() => navigator.clipboard.writeText(embed || link)}>
              copy discord link
            </button>
          </div>
        )}
        <div className="glass rounded-3xl p-5">
          <p className="text-sm text-neutral-300 mb-3">receive</p>
          <div className="flex gap-2">
            <input value={pull} onChange={(e) => setPull(e.target.value)} placeholder="fy-XXXXXX" className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm outline-none" />
            <button onClick={receive} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">pull</button>
          </div>
          {got && (
            <a href={got.url} className="block mt-4 text-sm text-[#0a84ff]">
              {got.name} · {formatBytes(got.size)}
            </a>
          )}
        </div>
        {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
        {msg && <p className="text-neutral-400 text-sm mt-3">{msg}</p>}
      </main>
    </div>
  );
}
