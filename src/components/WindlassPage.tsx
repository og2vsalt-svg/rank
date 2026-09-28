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

function turnsFor(size: number) {
  return Math.max(1, Math.ceil(size / (64 * 1024)));
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function WindlassPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [mode, setMode] = useState<'coil' | 'file'>('coil');

  const turns = file ? turnsFor(file.size) : 0;

  const pick = (f?: File) => {
    if (!f) return;
    setFile(f);
    setErr('');
    setEmbed('');
    setApp('');
    setWarn(f.size > 40 * 1024 * 1024 ? 'no cap. large files just make this tab slower while they encode.' : '');
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
      if (mode === 'coil') {
        const coil = {
          kind: 'windlass',
          name: file.name,
          mime: type,
          size,
          turns,
          wrap: '64kb',
          woundAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(coil, null, 2)], { type: 'application/json' });
        name = file.name.replace(/\.[^.]+$/, '') + '.windlass.json';
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
          author: 'windlass',
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
      setErr(e?.message || 'windlass failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">windlass</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">wind a local file, then haul it up.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. count 64kb turns in the tab. ship a tiny coil ticket or the original into the public share table. discord unfurls /s.
          </p>

          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            <p className="text-white font-medium">{file ? file.name : 'drop one file'}</p>
            {file && (
              <p className="text-xs text-neutral-500 mt-2">
                {pretty(file.size)} · {file.type || 'unknown'} · {turns} turn{turns === 1 ? '' : 's'}
              </p>
            )}
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>

          {file && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-white/10 p-5 mb-6"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  {Array.from({ length: Math.min(turns, 8) }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute inset-0 rounded-full border border-[#0a84ff]/40"
                      style={{ transform: `scale(${1 - i * 0.1})`, opacity: 1 - i * 0.08 }}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-xs text-neutral-500">coil</p>
                  <p className="text-white font-medium">{turns} turn{turns === 1 ? '' : 's'}</p>
                  <p className="text-xs text-neutral-500 mt-1">each wrap is 64kb. large files just take more turns.</p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode('coil')}
              className={`px-4 py-2 rounded-full text-sm transition ${mode === 'coil' ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}
            >
              ship coil
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
            {busy ? 'winding…' : 'pin to share db'}
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
