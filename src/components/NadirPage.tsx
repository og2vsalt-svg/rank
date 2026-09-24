import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return 'nd-' + Date.now().toString(36);
}

function hexPreview(buf: ArrayBuffer, max = 256) {
  const bytes = new Uint8Array(buf.slice(0, max));
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const slice = [...bytes.slice(i, i + 16)];
    const hex = slice.map((b) => b.toString(16).padStart(2, '0')).join(' ');
    const ascii = slice.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
    parts.push(hex.padEnd(47, ' ') + '  ' + ascii);
  }
  return parts.join('\n');
}

export default function NadirPage() {
  const [info, setInfo] = useState('');
  const [hex, setHex] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const inspect = async (f: File) => {
    setFile(f);
    setWarn(f.size > 30 * 1024 * 1024 ? 'huge file. only the first slice gets peeked. no size lock.' : '');
    setMsg('');
    setLink('');
    const head = await f.slice(0, 4096).arrayBuffer();
    setInfo(`${f.name}\n${f.type || 'unknown type'} · ${f.size} bytes · last modified ${f.lastModified ? new Date(f.lastModified).toISOString() : '—'}`);
    setHex(hexPreview(head));
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('read failed'));
      r.readAsDataURL(file);
    });
    const id = uid();
    const res = await publishShare({
      id,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      dataUrl,
    });
    setBusy(false);
    if (!res.ok) {
      setMsg(res.error || 'publish failed');
      return;
    }
    const urls = shareUrls(res.id || id);
    setLink(urls.embed);
    setMsg('parked in the public share table.');
    if (res.warn) setWarn(res.warn);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-2xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">
          nadir
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-semibold tracking-tight mb-3">
          peek the bytes, then share.
        </motion.h1>
        <p className="text-neutral-400 text-sm mb-8">not a vault grid. just a local hex glance so you know what you are about to publish.</p>
        <div className="glass rounded-[28px] p-6 space-y-4">
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && inspect(e.target.files[0])} />
            <p className="text-sm text-neutral-300">choose any local file</p>
          </label>
          {info && <pre className="text-xs text-neutral-400 whitespace-pre-wrap">{info}</pre>}
          {hex && (
            <pre className="text-[11px] leading-5 text-neutral-500 bg-black/30 rounded-2xl p-4 overflow-x-auto font-mono">
              {hex}
            </pre>
          )}
          {file && (
            <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
              {busy ? 'publishing…' : 'publish original'}
            </button>
          )}
          {warn && <p className="text-xs text-amber-300/80">{warn}</p>}
          {msg && <p className="text-xs text-neutral-400">{msg}</p>}
          {link && <p className="text-xs text-neutral-500 break-all">discord embed {link}</p>}
        </div>
      </main>
    </div>
  );
}
