import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ReceiptPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [digest, setDigest] = useState('');
  const [embed, setEmbed] = useState('');
  const [meta, setMeta] = useState('');

  const onFile = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setEmbed('');
    setDigest('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'hashing a chunky file can stall the tab. no hard limit.' : '');
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const hash = await sha256(buf);
      setDigest(hash);
      const text = [
        'rankvault receipt',
        `name: ${file.name}`,
        `type: ${file.type || 'application/octet-stream'}`,
        `size: ${file.size}`,
        `sha-256: ${hash}`,
        `when: ${new Date().toISOString()}`,
      ].join('\n');
      setMeta(text);
      const id = 'rcpt-' + hash.slice(0, 12);
      const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
      const res = await publishShare({
        id,
        name: file.name.replace(/\.[^.]+$/, '') + '.receipt.txt',
        type: 'text/plain',
        size: text.length,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'receipt published locally only');
        return;
      }
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not hash file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">receipt</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">keep the hash. ship only the slip.</h1>
          <p className="text-neutral-400 text-sm mb-6">the original stays on this machine. a sha-256 receipt goes to the share db so discord can show a clean card.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'weighing…' : 'drop a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when hashing might feel slow.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {digest && <p className="text-xs text-neutral-400 mt-4 break-all font-mono">{digest}</p>}
          {meta && <pre className="text-[11px] text-neutral-500 mt-3 whitespace-pre-wrap">{meta}</pre>}
          {embed && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
