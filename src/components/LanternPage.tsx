import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function LanternPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const light = async () => {
    if (!file) return;
    setErr('');
    setWarn(file.size > 12 * 1024 * 1024 ? 'chunky file. encoding may feel sleepy. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const stamp = Date.now().toString(36);
      const id = `lantern-${stamp}`;
      const name = note.trim() ? `${note.trim().slice(0, 40)} · ${file.name}` : file.name;
      const res = await publishShare({
        id,
        name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'lantern',
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto">
          <p className="text-[#0a84ff] text-sm mb-2">lantern</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">hang a light on a local file.</h1>
          <p className="text-neutral-400 text-sm mb-8">not a vault grid. pick one file, write a short caption, ship it to the share db. discord unfurls /s.</p>
          <label className="block glass rounded-3xl p-8 text-center cursor-pointer mb-5 hover:bg-white/[0.04] transition-colors">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-white">{file ? file.name : 'choose a file'}</p>
            {file && <p className="text-xs text-neutral-500 mt-1">{formatBytes(file.size)} · {file.type || 'file'}</p>}
          </label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional caption" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none mb-4" />
          <button onClick={light} disabled={!file || busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition-colors">
            {busy ? 'lighting…' : 'light and copy embed'}
          </button>
          {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {link && <p className="text-[#0a84ff] text-xs mt-4 break-all">{link}</p>}
        </motion.div>
      </main>
    </div>
  );
}
