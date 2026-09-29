import { useState } from 'react';
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

export default function CamberPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const ship = async () => {
    setErr('');
    setEmbed('');
    setApp('');
    if (!file && !note.trim()) {
      setErr('add a file or a short note.');
      return;
    }
    setBusy(true);
    try {
      let payloadFile = file;
      if (!payloadFile) {
        payloadFile = new File([note.trim()], 'camber.txt', { type: 'text/plain' });
      }
      setWarn(payloadFile.size > 40 * 1024 * 1024 ? 'no cap, but this size can make the tab feel sleepy.' : '');
      const dataUrl = await readAsDataUrl(payloadFile);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const name = note.trim() ? `${note.trim().slice(0, 48)}${file ? ' — ' + file.name : '.txt'}` : payloadFile.name;
      const res = await publishShare({
        id,
        name,
        type: payloadFile.type || 'application/octet-stream',
        size: payloadFile.size,
        dataUrl,
        author: note.trim() || undefined,
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'camber failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">camber</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lean a note against a file.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            caption rides on the share name so discord unfurls with the line you wrote. file is optional — a note alone becomes a .txt drop.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="a short line for the card"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50 resize-none"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setFile(e.dataTransfer.files?.[0] || null);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-white font-medium">{file ? file.name : 'optional file'}</p>
            {file && <p className="text-xs text-neutral-500 mt-2">{pretty(file.size)}</p>}
          </label>
          <button onClick={ship} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
            {busy ? 'leaning…' : 'publish camber'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
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
