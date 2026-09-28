import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function YarrowPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [picked, setPicked] = useState<File | null>(null);

  const smallest = files.slice().sort((a, b) => a.size - b.size)[0] || null;

  const ship = async () => {
    const file = smallest;
    if (!file) return;
    setPicked(file);
    setBusy(true); setErr(''); setEmbed('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'even the smallest is chunky. tab may lag.' : '');
    try {
      const dataUrl = await readAsDataUrl(file);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setEmbed(urls.card);
      try { await navigator.clipboard.writeText(urls.card); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'yarrow failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">yarrow</p>
          <h1 className="text-3xl font-semibold mb-3">cast a pile. ship only the smallest stalk.</h1>
          <p className="text-neutral-400 text-sm mb-6">decision desk, not a vault. we keep every local file in view, then publish the lightest one to the share db.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(e.target.files ? [...e.target.files] : [])} />
            <p className="text-white font-medium">{files.length ? `${files.length} in the pile` : 'drop several files'}</p>
          </label>
          {files.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {files.slice().sort((a, b) => a.size - b.size).map((f) => (
                <li key={f.name + f.size} className={`text-xs rounded-xl px-3 py-2 ${smallest === f ? 'bg-[#0a84ff]/15 text-white' : 'text-neutral-400'}`}>
                  {f.name} · {pretty(f.size)}{smallest === f ? ' · chosen' : ''}
                </li>
              ))}
            </ul>
          )}
          <button disabled={!smallest || busy} onClick={ship} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'shipping…' : 'share the smallest'}
          </button>
          {picked && <p className="text-xs text-neutral-500 mt-3">sent {picked.name}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-3 break-all">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
