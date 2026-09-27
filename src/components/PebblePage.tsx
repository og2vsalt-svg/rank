import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function PebblePage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [print, setPrint] = useState<{ name: string; size: number; type: string; hash: string } | null>(null);
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const inspect = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setEmbed('');
    setApp('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky pebble. hashing might feel sleepy. no hard cap.' : '');
    setBusy(true);
    try {
      const hash = await sha256(file);
      setPrint({ name: file.name, size: file.size, type: file.type || 'application/octet-stream', hash });
    } catch (e: any) {
      setErr(e?.message || 'could not read that pebble');
    } finally {
      setBusy(false);
    }
  };

  const publish = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky pebble. encoding might feel sleepy. no hard cap.' : '');
    setBusy(true);
    try {
      const hash = print?.name === file.name ? print.hash : await sha256(file);
      setPrint({ name: file.name, size: file.size, type: file.type || 'application/octet-stream', hash });
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: hash.slice(0, 12),
      });
      if (!res.ok) {
        setErr(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'pebble slipped');
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
          <p className="text-[#0a84ff] text-sm mb-2">pebble</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stamp a file. share if you want.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            hashes stay on this device first. if you publish, the share db gets the bytes and discord gets an /s card. not a vault grid.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); inspect(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => inspect(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'turning it over…' : 'drop one file on the pebble'}</p>
            <p className="text-xs text-neutral-500 mt-2">inspect first. publish is a second tap. no size lock.</p>
          </label>
          {print && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-white">{print.name}</p>
              <p className="text-neutral-500">{pretty(print.size)} · {print.type}</p>
              <p className="text-[11px] text-neutral-500 break-all font-mono">{print.hash}</p>
              <label className="inline-flex mt-2">
                <input type="file" className="hidden" onChange={(e) => publish(e.target.files)} />
                <span className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium cursor-pointer">{busy ? 'publishing…' : 'publish + copy /s'}</span>
              </label>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app link: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
