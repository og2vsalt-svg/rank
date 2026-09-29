import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function PorticoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [headline, setHeadline] = useState('');
  const [blurb, setBlurb] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const pick = (f?: File) => {
    if (!f) return;
    setFile(f);
    setHeadline(f.name.replace(/\.[^.]+$/, ''));
    setBlurb(`${pretty(f.size)} · ${f.type || 'file'} · public drop on rankvault`);
    setWarn(f.size > 40 * 1024 * 1024 ? 'no cap, but encoding this size can make the tab feel sleepy.' : '');
    setErr('');
    setEmbed('');
    setApp('');
  };

  const ship = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: headline.trim() || file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'portico',
      });
      if (!res.ok) throw new Error(res.error || 'publish failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'portico failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">portico</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">preview the discord card, then walk the file through.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. one local file becomes a public share-db drop. the /s link is what discord unfurls.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-8 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">{file ? file.name : 'drop a file onto the steps'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. only a slowness warning.</p>
          </label>
          {file && (
            <div className="mt-6 space-y-3">
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="card title" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none" />
              <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} rows={2} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none resize-none" />
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#2b2d31]">
                <div className="flex">
                  <div className="w-1 bg-[#0a84ff]" />
                  <div className="p-4 flex-1">
                    <p className="text-[12px] text-[#00a8fc] mb-1">rankvault</p>
                    <p className="text-white text-[15px] font-semibold leading-tight">{headline || file.name}</p>
                    <p className="text-[#dbdee1] text-[13px] mt-1">{blurb}</p>
                  </div>
                </div>
              </div>
              <button disabled={busy} onClick={ship} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
                {busy ? 'walking through…' : 'publish to share db'}
              </button>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-5 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
