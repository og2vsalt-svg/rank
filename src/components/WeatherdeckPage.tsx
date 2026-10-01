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

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function WeatherdeckPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [picked, setPicked] = useState(0);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const add = (list: FileList | null) => {
    const next = list ? Array.from(list) : [];
    setFiles(next);
    setPicked(0);
    setLink('');
    setErr('');
    const heavy = next.find((f) => f.size > 20 * 1024 * 1024);
    setWarn(heavy ? `${heavy.name} is large. the tab may lag. no hard cap.` : '');
  };

  const send = async () => {
    const file = files[picked];
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'weatherdeck',
      });
      if (!res.ok) throw new Error(res.error || 'deck missed');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      if (res.warn) setWarn(res.warn);
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
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-7"
        >
          <p className="text-[#0a84ff] text-sm mb-2">weatherdeck</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lay several locals on deck. publish one.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            pick a handful of files, choose the one that should go public, then send it to the share table. discord unfurls /s.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-5 transition-colors duration-300">
            <input type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
            <span className="text-sm text-neutral-300">{files.length ? `${files.length} on deck` : 'drop a few files'}</span>
          </label>
          {files.length > 0 && (
            <div className="space-y-1 mb-5">
              {files.map((f, i) => (
                <button
                  key={f.name + i}
                  onClick={() => setPicked(i)}
                  className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm transition-colors ${
                    picked === i ? 'bg-white text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {f.name} · {pretty(f.size)}
                </button>
              ))}
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={send} disabled={busy || !files[picked]} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'publishing…' : 'publish chosen file'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
