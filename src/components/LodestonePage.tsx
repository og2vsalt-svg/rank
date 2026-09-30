import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function LodestonePage() {
  const [busy, setBusy] = useState(false);
  const [hash, setHash] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [name, setName] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setLink('');
    setEmbed('');
    setName(f.name);
    setWarn(f.size > 24 * 1024 * 1024 ? 'heavy stone. hashing and upload may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const digest = await sha256(f);
      setHash(digest);
      const dataUrl = await readAsDataUrl(f);
      const id = uid();
      const pub = await publishShare({
        id,
        name: `${f.name} · ${digest.slice(0, 12)}`,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
        author: digest.slice(0, 16),
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not set the stone');
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
      setErr(e?.message || 'lodestone failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">lodestone</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hash a local file, then publish the pull.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            sha-256 stays on this machine first. the short prefix rides on the discord card title so the drop can be checked later.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'finding north…' : name ? `swap ${name}` : 'drop a file on the stone'}</p>
            <p className="text-xs text-neutral-500 mt-2">the embed link copies itself.</p>
          </label>
          {hash && (
            <p className="mt-4 text-[11px] text-neutral-500 break-all font-mono">{hash}</p>
          )}
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
