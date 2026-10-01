import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SLOW = 12 * 1024 * 1024;

export default function SlipwayPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [result, setResult] = useState<{ id: string; embedPath: string } | null>(null);
  const [err, setErr] = useState('');

  function pick(f: File | null) {
    setFile(f);
    setResult(null);
    setErr('');
    setWarn(f && f.size > SLOW ? 'this one is heavy. the tab and the upload may feel slow. there is no size lock.' : '');
  }

  async function launch() {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('caption', caption);
      body.append('author', author);
      const res = await fetch('/api/share', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'launch failed');
      setResult({ id: data.id, embedPath: data.embedPath || `/s/${data.id}` });
      if (data.warn) setWarn(data.warn);
    } catch (e: any) {
      setErr(e.message || 'could not reach the share database');
    } finally {
      setBusy(false);
    }
  }

  const card = result ? `${location.origin}${result.embedPath}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">slipway</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-semibold tracking-tight text-white mb-3">launch a local file.</motion.h1>
        <p className="text-neutral-400 mb-6 leading-relaxed">the bytes go straight to the share database. discord unfurls the /s card. no hard cap — only a warning if it may crawl.</p>
        <label className="glass rounded-3xl p-8 block text-center cursor-pointer hover:-translate-y-0.5 transition">
          <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
          <p className="text-white text-sm">{file ? file.name : 'choose a file from this device'}</p>
          {file && <p className="text-[12px] text-neutral-500 mt-2">{file.type || 'unknown type'} · {(file.size / 1024).toFixed(0)} KB</p>}
        </label>
        <div className="mt-4 space-y-3">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the discord card" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
          <button onClick={launch} disabled={!file || busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'launching…' : 'launch'}</button>
          {warn && <p className="text-sm text-amber-200/90">{warn}</p>}
          {err && <p className="text-sm text-red-300">{err}</p>}
          {result && (
            <div className="glass rounded-2xl p-4 text-sm">
              <p className="text-white mb-1">filed as {result.id}</p>
              <a className="text-[#0a84ff] break-all" href={card}>{card}</a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
