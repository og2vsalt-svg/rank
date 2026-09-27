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

export default function PorticoPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const hold = async (f: File | undefined) => {
    if (!f) return;
    setErr('');
    setLink('');
    setEmbed('');
    setFile(f);
    setWarn(f.size > 40 * 1024 * 1024 ? 'no cap. encoding this much can stall the tab for a bit.' : '');
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview('');
    }
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const name = note.trim() ? `${note.trim()} — ${file.name}` : file.name;
      const res = await publishShare({
        id,
        name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'portico failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">portico</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stand in the doorway, then step out.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            dress a local file as a card before it becomes a public share. discord unfurls the /s link.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); hold(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => hold(e.target.files?.[0])} />
            <p className="text-white font-medium">{file ? file.name : 'leave a file on the step'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {file && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              {preview && (
                <img src={preview} alt="" className="w-full max-h-56 object-cover rounded-[22px] mb-4" />
              )}
              <p className="text-xs text-neutral-500 mb-3">{pretty(file.size)} · {file.type || 'unknown'}</p>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="optional porch note"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40 mb-4"
              />
              <button
                onClick={send}
                disabled={busy}
                className="w-full rounded-full bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-50"
              >
                {busy ? 'stepping out…' : 'open the door'}
              </button>
            </motion.div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
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
