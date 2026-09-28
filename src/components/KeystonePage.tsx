import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function hexFromBytes(bytes: Uint8Array) {
  const a = bytes[0] ?? 10;
  const b = bytes[Math.floor(bytes.length / 2)] ?? 132;
  const c = bytes[bytes.length - 1] ?? 255;
  return `#${[a, b, c].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

async function sha256(buf: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function KeystonePage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [stone, setStone] = useState('#0a84ff');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [mode, setMode] = useState<'receipt' | 'file'>('receipt');

  const pick = async (f?: File) => {
    if (!f) return;
    setFile(f);
    setErr('');
    setEmbed('');
    setApp('');
    setWarn(f.size > 40 * 1024 * 1024 ? 'no cap. large files just make this tab slower while they encode.' : '');
    try {
      const buf = await f.arrayBuffer();
      const bytes = new Uint8Array(buf.slice(0, 64));
      setStone(hexFromBytes(bytes));
      setHash(await sha256(buf));
    } catch {
      setHash('');
    }
  };

  const ship = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      let name = file.name;
      let type = file.type || 'application/octet-stream';
      let size = file.size;
      let dataUrl: string;
      if (mode === 'receipt') {
        const receipt = {
          kind: 'keystone',
          name: file.name,
          mime: type,
          size,
          sha256: hash,
          stone,
          notedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
        name = file.name.replace(/\.[^.]+$/, '') + '.keystone.json';
        type = 'application/json';
        size = blob.size;
        dataUrl = await readAsDataUrl(new File([blob], name, { type }));
      } else {
        dataUrl = await readAsDataUrl(file);
      }
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          size,
          dataUrl,
          author: 'keystone',
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (json.warn) setWarn(json.warn);
    } catch (e: any) {
      setErr(e?.message || 'keystone failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">keystone</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">weigh a local file, then pin a receipt.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. hash stays in the tab first. ship either a tiny json receipt or the original into the public share table. discord unfurls /s.
          </p>

          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            <p className="text-white font-medium">{file ? file.name : 'drop one file'}</p>
            {file && <p className="text-xs text-neutral-500 mt-2">{pretty(file.size)} · {file.type || 'unknown'}</p>}
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>

          {file && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 overflow-hidden mb-6"
            >
              <div className="h-16" style={{ background: `linear-gradient(135deg, ${stone}, #0a84ff)` }} />
              <div className="p-4">
                <p className="text-xs text-neutral-500">stone</p>
                <p className="text-sm text-white font-medium">{stone}</p>
                {hash && (
                  <>
                    <p className="text-xs text-neutral-500 mt-3">sha-256</p>
                    <p className="text-[11px] break-all text-neutral-300 font-mono">{hash}</p>
                  </>
                )}
              </div>
            </motion.div>
          )}

          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode('receipt')}
              className={`px-4 py-2 rounded-full text-sm transition ${mode === 'receipt' ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}
            >
              ship receipt
            </button>
            <button
              onClick={() => setMode('file')}
              className={`px-4 py-2 rounded-full text-sm transition ${mode === 'file' ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}
            >
              ship original
            </button>
          </div>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

          <button
            disabled={!file || busy}
            onClick={ship}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'setting the stone…' : 'pin to share db'}
          </button>

          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
