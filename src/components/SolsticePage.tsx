import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function SolsticePage() {
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [digest, setDigest] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [receipt, setReceipt] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setName(file.name);
    setSize(file.size);
    if (file.size > 80 * 1024 * 1024) {
      setWarn('huge file. hashing stays in this tab so it may hitch. no cap.');
    } else {
      setWarn('');
    }
    const buf = await file.arrayBuffer();
    const hex = await sha256(buf);
    setDigest(hex);
    setBusy(false);
  };

  const stamp = async () => {
    if (!digest) return;
    setBusy(true);
    const body = JSON.stringify(
      {
        kind: 'rankvault-solstice',
        name,
        size,
        sha256: digest,
        stampedAt: new Date().toISOString(),
      },
      null,
      2,
    );
    const dataUrl = `data:application/json;base64,${btoa(unescape(encodeURIComponent(body)))}`;
    const id = 'sol-' + digest.slice(0, 10);
    const res = await publishShare({
      id,
      name: 'solstice.json',
      type: 'application/json',
      size: body.length,
      dataUrl,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'receipt missed the db');
      return;
    }
    if (res.warn) setWarn(res.warn);
    setReceipt(shareUrls(res.id || id).embed);
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
          <p className="text-[#0a84ff] text-sm mb-2">solstice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stamp a file. keep the fingerprint, not the blob.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            we hash locally, then park a tiny receipt in the share db. useful when you want proof without parking the whole dump.
          </p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <span className="text-sm text-neutral-300">{busy ? 'reading…' : name || 'choose a file'}</span>
          </label>
          {digest && (
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/8 p-4">
              <p className="text-[11px] text-neutral-500">sha-256</p>
              <p className="text-xs text-neutral-300 break-all mt-1 font-mono">{digest}</p>
              <p className="text-[11px] text-neutral-600 mt-2">{size.toLocaleString()} bytes</p>
            </div>
          )}
          {digest && (
            <button onClick={stamp} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              publish receipt
            </button>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {receipt && (
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/8 p-4">
              <p className="text-[11px] text-neutral-500">discord embed</p>
              <p className="text-xs text-neutral-300 break-all mt-1">{receipt}</p>
              <button
                onClick={() => navigator.clipboard.writeText(receipt)}
                className="mt-3 px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
              >
                copy embed
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
