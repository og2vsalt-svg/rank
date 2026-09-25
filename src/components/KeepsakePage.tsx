import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function KeepsakePage() {
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [digest, setDigest] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);

  const card = useMemo(() => {
    if (!digest) return '';
    return [
      'rankvault keepsake',
      `file: ${name || 'untitled'}`,
      `bytes: ${size}`,
      `sha256: ${digest}`,
      `when: ${new Date().toISOString()}`,
      'no upload. this card never left the tab.',
    ].join('\n');
  }, [digest, name, size]);

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setBusy(true);
    setWarn(f.size > 40 * 1024 * 1024 ? 'chunky file. hashing stays in this tab and may feel slow. no cap.' : '');
    try {
      const h = await sha256(await f.arrayBuffer());
      setName(f.name);
      setSize(f.size);
      setDigest(h);
    } catch {
      setWarn('could not hash that file');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!card) return;
    try { await navigator.clipboard.writeText(card); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">keepsake</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a receipt, not a vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">hash a local file and keep a signed-looking card. nothing goes to the share db unless you drop it somewhere else.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'hashing…' : 'pick a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">stays on device. no size lock.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {digest && (
            <div className="mt-6 rounded-2xl bg-black/40 border border-white/8 p-5">
              <p className="text-white font-medium mb-1">{name}</p>
              <p className="text-xs text-neutral-500 mb-3">{size.toLocaleString()} bytes</p>
              <p className="text-[11px] text-neutral-400 break-all font-mono">{digest}</p>
              <button onClick={copy} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">copy keepsake</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
