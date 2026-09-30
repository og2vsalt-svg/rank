import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function hex(buf: ArrayBuffer, take: number) {
  const u = new Uint8Array(buf);
  const slice = u.slice(0, take);
  return Array.from(slice).map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not punch the file'));
    r.readAsDataURL(file);
  });
}

export default function GrommetPage() {
  const [peek, setPeek] = useState<{ name: string; size: number; head: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const punch = async (file: File) => {
    setErr('');
    setLink('');
    setWarn(file.size > 24 * 1024 * 1024 ? 'wide cloth. reading the whole bolt can slow the tab. no cap.' : '');
    setBusy(true);
    try {
      const headBuf = await file.slice(0, 24).arrayBuffer();
      setPeek({ name: file.name, size: file.size, head: hex(headBuf, 24) });
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'grommet',
      });
      if (!res.ok) throw new Error(res.error || 'the eyelet tore');
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
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-7"
        >
          <p className="text-[#0a84ff] text-sm mb-2">grommet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">punch an eyelet, keep the cloth.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            peek the first bytes of a local file, then hang the original on the public share table. not a vault shelf.
          </p>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void punch(f);
            }}
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center mb-5 transition-all duration-300"
          >
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void punch(f);
              }}
            />
            <span className="text-sm text-neutral-300">{busy ? 'punching…' : 'drop a file on the die'}</span>
          </label>
          {peek && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/5 p-4 mb-4 space-y-1">
              <p className="text-sm text-white">{peek.name}</p>
              <p className="text-xs text-neutral-400">{pretty(peek.size)}</p>
              <p className="text-[11px] font-mono text-neutral-500 break-all">{peek.head}</p>
            </motion.div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          {link && <p className="text-xs text-neutral-500 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
