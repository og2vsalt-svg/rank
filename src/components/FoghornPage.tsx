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

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function FoghornPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const blast = async () => {
    if (!file) {
      setErr('pick a file first');
      return;
    }
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap, but this size can make the tab feel sleepy while it encodes.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: note.trim() ? `${note.trim()} — ${file.name}` : file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: author.trim() || undefined,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'foghorn failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed || `${window.location.origin}/s/${json.id}`);
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
      if (json.warn) setWarn(json.warn);
    } catch (e: any) {
      setErr(e?.message || 'foghorn failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">foghorn</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">name the drop, then blow it public.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. one local file plus a short call sign. the /s link is the discord card.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files?.[0] || null); }}
          >
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-white font-medium">{file ? file.name : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">{file ? pretty(file.size) : 'no hard limit. we only warn when it might feel slow.'}</p>
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="call sign / title for the card"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="optional author on the card"
            className="w-full mb-5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <button
            onClick={blast}
            disabled={busy}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'sounding…' : 'sound the horn'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
