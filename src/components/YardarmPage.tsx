import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function YardarmPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [receipt, setReceipt] = useState('');
  const [embed, setEmbed] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setEmbed('');
    setReceipt('');
    setWarn(f.size > 12 * 1024 * 1024 ? 'long hoist. encoding may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const digest = await sha256(buf);
      const blob = new Blob([f], { type: f.type || 'application/octet-stream' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not read file'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const pub = await publishShare({
        id,
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        setReceipt(`local hash only\n${f.name}\nsha-256 ${digest}\n${f.size} bytes`);
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      setReceipt(`${f.name}\nsha-256 ${digest}\n${f.size} bytes\nid ${id}\ncard ${urls.embed}`);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'yardarm failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">yardarm</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hash a local file, then fly it to the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            fingerprint first, publish second. the embed link is what you paste in discord.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'hoisting…' : 'drop a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-sm text-red-400 mt-3">{err}</p>}
          {receipt && <pre className="mt-5 text-xs text-neutral-300 whitespace-pre-wrap bg-black/30 rounded-2xl p-4">{receipt}</pre>}
          {embed && <p className="text-sm text-[#0a84ff] mt-3 break-all">{embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
