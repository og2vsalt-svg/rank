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
    r.onerror = () => reject(new Error('could not sound the file'));
    r.readAsDataURL(file);
  });
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function FathomPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [sounding, setSounding] = useState<{ name: string; size: number; type: string; hash: string } | null>(null);

  const run = async (file: File) => {
    setErr('');
    setEmbed('');
    setApp('');
    setWarn(file.size > 24 * 1024 * 1024 ? 'deep water. hashing a file this heavy can hitch the tab. no hard cap.' : '');
    setBusy(true);
    try {
      const hash = await sha256(file);
      setSounding({ name: file.name, size: file.size, type: file.type || 'application/octet-stream', hash });
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'fathom',
      });
      if (!res.ok) throw new Error(res.error || 'could not mark the sounding');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'sounding failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">fathom</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">sound a local file, then hang the drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. this desk hashes in the tab, writes the original into the share table, and hands you a discord card.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void run(f);
            }}
          >
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void run(f);
              }}
            />
            <p className="text-white font-medium">{busy ? 'sounding…' : 'drop a file to take a sounding'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. only a slowness warning if the water is deep.</p>
          </label>
          {sounding && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl bg-white/5 p-4 space-y-1"
            >
              <p className="text-sm text-white">{sounding.name}</p>
              <p className="text-xs text-neutral-400">{pretty(sounding.size)} · {sounding.type}</p>
              <p className="text-[11px] text-neutral-500 break-all font-mono">{sounding.hash}</p>
            </motion.div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-500">discord card (copied)</p>
              <p className="text-xs text-neutral-300 break-all">{embed}</p>
              <p className="text-xs text-neutral-500 break-all">{app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
