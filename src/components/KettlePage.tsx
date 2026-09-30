import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function KettlePage() {
  const [label, setLabel] = useState('');
  const [steep, setSteep] = useState('3');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);

  const brew = async (file: File) => {
    setErr('');
    setEmbed('');
    setApp('');
    setMeta({ name: file.name, size: file.size });
    setWarn(file.size > 32 * 1024 * 1024 ? 'no cap. a file this heavy can make the tab feel slow while it steeps.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const minutes = Number(steep) || 0;
      const expiresAt = minutes > 0 ? new Date(Date.now() + minutes * 60 * 1000).toISOString() : null;
      const name = label.trim() ? `${label.trim()}-${file.name}` : file.name;
      const id = uid();
      const res = await publishShare({
        id,
        name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        expiresAt,
        author: 'kettle',
      });
      if (!res.ok) throw new Error(res.error || 'kettle failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      if (res.warn) setWarn(res.warn);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'kettle failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">kettle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">steep a local file, then pour it into the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. optional steep time becomes an expiry. discord unfurls /s. no hard size cap — only a slowness warning.
          </p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="optional label on the kettle"
            className="w-full mb-3 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/40"
          />
          <label className="block text-xs text-neutral-500 mb-4">
            steep minutes (0 keeps it awake)
            <input
              value={steep}
              onChange={(e) => setSteep(e.target.value)}
              inputMode="numeric"
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/40"
            />
          </label>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) brew(f);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && brew(e.target.files[0])} />
            <p className="text-white font-medium">{busy ? 'steeping…' : 'drop a local file into the kettle'}</p>
            <p className="text-xs text-neutral-500 mt-2">the discord embed link copies itself.</p>
          </label>
          {meta && (
            <p className="text-xs text-neutral-500 mt-4">
              {meta.name} · {pretty(meta.size)}
            </p>
          )}
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>discord (copied): {embed}</p>
              <p>app: {app}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
