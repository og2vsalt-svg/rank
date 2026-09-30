import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function FathomPage() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<{
    name: string;
    type: string;
    size: number;
    last: string;
    hash?: string;
    warn?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const onFile = async (picked: File) => {
    setFile(picked);
    setEmbed('');
    setErr('');
    setBusy(true);
    const warn =
      picked.size > 40 * 1024 * 1024
        ? 'large file. hashing and publish may feel slow. no hard cap.'
        : picked.size > 8 * 1024 * 1024
          ? 'chunky file. give the tab a second.'
          : undefined;
    let hash: string | undefined;
    try {
      hash = await sha256(await picked.arrayBuffer());
    } catch {
      hash = undefined;
    }
    setInfo({
      name: picked.name,
      type: picked.type || 'unknown',
      size: picked.size,
      last: picked.lastModified ? new Date(picked.lastModified).toISOString() : '',
      hash,
      warn,
    });
    setBusy(false);
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = `fathom-${Date.now().toString(36)}`;
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: info?.hash ? `sha256:${info.hash.slice(0, 12)}` : 'fathom',
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish to the share db');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
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
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sound a local file. publish if you want.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            inspect name, type, size, and sha-256, then send it to the share database. discord cards use the /s/ path.
          </p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <span className="text-sm text-neutral-300">{busy ? 'working…' : 'drop or choose a file'}</span>
          </label>
          {info && (
            <div className="mt-6 space-y-2 text-sm text-neutral-300">
              <p><span className="text-neutral-500">name</span> {info.name}</p>
              <p><span className="text-neutral-500">type</span> {info.type}</p>
              <p><span className="text-neutral-500">size</span> {pretty(info.size)}</p>
              {info.last && <p><span className="text-neutral-500">modified</span> {info.last}</p>}
              {info.hash && (
                <p className="break-all"><span className="text-neutral-500">sha-256</span> {info.hash}</p>
              )}
              {info.warn && <p className="text-amber-400/80 text-xs pt-2">{info.warn}</p>}
              <button disabled={busy} onClick={publish} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
                publish to share db
              </button>
            </div>
          )}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="mt-4 text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
