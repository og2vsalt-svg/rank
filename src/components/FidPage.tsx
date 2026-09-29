import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function hex(buf: ArrayBuffer, n = 16) {
  return Array.from(new Uint8Array(buf).slice(0, n))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

function guess(bytes: Uint8Array, type: string, name: string) {
  const s = String.fromCharCode(...bytes.slice(0, 16));
  if (bytes[0] === 0x89 && s.includes('PNG')) return 'png still';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpeg still';
  if (s.startsWith('GIF8')) return 'gif still';
  if (s.startsWith('%PDF')) return 'pdf folio';
  if (s.startsWith('PK')) return 'zip-like archive';
  if (s.startsWith('ID3') || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return 'audio-ish';
  if (type) return type;
  const ext = name.split('.').pop();
  return ext || 'unknown';
}

export default function FidPage() {
  const [peek, setPeek] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [busy, setBusy] = useState(false);

  const inspect = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setEmbed('');
    setErr('');
    setWarn(f.size > 20 * 1024 * 1024 ? 'thick splice. reading the head is fine; publishing may feel slow. no cap.' : '');
    const head = await f.slice(0, 32).arrayBuffer();
    const bytes = new Uint8Array(head);
    setPeek(`${guess(bytes, f.type, f.name)} \u00b7 ${pretty(f.size)} \u00b7 ${hex(head)}`);
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
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
        author: 'fid',
      });
      if (!res.ok) throw new Error(res.error || 'publish failed');
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'fid failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">fid</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">open the first bytes, then ship if you want.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            inspection stays in the tab. publishing writes the original into the share db so discord can unfurl /s.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => inspect(e.target.files)} />
            <p className="text-white font-medium">peek at a local file</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {peek && <p className="text-sm text-neutral-300 mt-4 font-mono break-all">{peek}</p>}
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {file && (
            <button onClick={publish} disabled={busy} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
              {busy ? 'publishing…' : 'publish original'}
            </button>
          )}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
