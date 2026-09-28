import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function DewpointPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [link, setLink] = useState('');

  const dew = useMemo(() => {
    if (!file) return 0;
    const mb = file.size / (1024 * 1024);
    return Math.min(100, Math.round((mb / 80) * 100));
  }, [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'dewpoint failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">dewpoint</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">see how heavy the drop feels first.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a slowness meter, not a cap. we still ship whatever you pick into the public share table.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition">
            <input type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setEmbed(''); setLink(''); }} />
            <p className="text-white font-medium">{file ? file.name : 'choose a file'}</p>
            {file && <p className="text-xs text-neutral-500 mt-2">{pretty(file.size)} · {file.type || 'unknown'}</p>}
          </label>
          {file && (
            <div className="mt-6">
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-[#0a84ff]"
                  initial={{ width: 0 }}
                  animate={{ width: dew + '%' }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                {dew < 30 ? 'light. should feel instant.' : dew < 70 ? 'getting damp. the tab might pause while encoding.' : 'soaked. still allowed, just expect a sleepy encode.'}
              </p>
            </div>
          )}
          <button
            disabled={!file || busy}
            onClick={send}
            className="mt-6 w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition"
          >
            {busy ? 'condensing…' : 'publish drop'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-4 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
