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

function hone(name: string) {
  const raw = name.normalize('NFKD').replace(/[^\w.\- ]+/g, '').trim();
  const parts = raw.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop()!.toLowerCase() : '';
  const stem = parts.join('.').replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase() || 'file';
  return stem.slice(0, 80) + ext.slice(0, 12);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function WhetstonePage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [warn, setWarn] = useState('');

  const pick = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setName(hone(f.name));
    setErr('');
    setEmbed('');
    setWarn(f.size > 8 * 1024 * 1024 ? 'large file. preview clients may feel slow. no hard cap.' : '');
  };

  const ship = async () => {
    if (!file) {
      setErr('put a file on the stone first.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: name || hone(file.name),
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'whetstone',
      });
      if (!res.ok) throw new Error(res.error || 'whetstone failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      setWarn(res.warn || warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not ship');
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
          <p className="text-[#0a84ff] text-sm mb-2">whetstone</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hone a name, then let the file go.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. tidy a local filename, keep the bytes, publish a discord-ready /s card.
          </p>
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-8 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files)} />
            <span className="text-sm text-neutral-300">{file ? file.name : 'lay a file on the stone'}</span>
          </label>
          {file && (
            <div className="mt-5 space-y-3">
              <p className="text-xs text-neutral-500">{file.type || 'unknown type'} · {pretty(file.size)}</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl bg-black/30 border border-white/10 text-sm text-neutral-200 px-4 py-3 outline-none focus:border-[#0a84ff]/50"
              />
              <button onClick={() => setName(hone(file.name))} className="text-xs text-neutral-500">reset to honed name</button>
            </div>
          )}
          <div className="mt-5">
            <button onClick={ship} disabled={busy} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'honing…' : 'publish drop'}
            </button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-5 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
