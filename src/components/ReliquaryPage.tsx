import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ReliquaryPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [digest, setDigest] = useState('');
  const [embed, setEmbed] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setDigest('');
    setEmbed('');
    setWarn(f.size > 30 * 1024 * 1024 ? 'large relic. hashing may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const hash = await sha256(buf);
      setDigest(hash);
      const receipt = `${f.name}\n${f.type || 'unknown'}\n${f.size} bytes\nsha-256 ${hash}\n`;
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(receipt)))}`;
      const id = uid();
      const pub = await publishShare({
        id,
        name: `${f.name}.receipt.txt`,
        type: 'text/plain',
        size: receipt.length,
        dataUrl,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'reliquary failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">reliquary</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">keep a hash of the thing, not the thing.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            sha-256 stays in the tab. only a receipt goes to the share db so discord can unfurl /s.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'weighing…' : 'set a relic down'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. the original never leaves unless you use another desk.</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {digest && <p className="mt-5 text-[11px] font-mono text-neutral-400 break-all">{digest}</p>}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
