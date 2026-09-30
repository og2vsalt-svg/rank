import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function LintelPage() {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const shipNote = async () => {
    const body = note.trim();
    if (!body) {
      setErr('write a lintel first');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([body], { type: 'text/plain' });
      const file = new File([blob], 'lintel.txt', { type: 'text/plain' });
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const pub = await publishShare({
        id,
        name: body.slice(0, 72) || 'lintel',
        type: 'text/plain',
        size: file.size,
        dataUrl,
        author: 'lintel',
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not set the beam');
        return;
      }
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'lintel failed');
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setWarn(f.size > 16 * 1024 * 1024 ? 'heavy beam. encoding may feel slow. no hard cap.' : '');
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(f);
      const id = uid();
      const labeled = note.trim() ? `${note.trim().slice(0, 80)} — ${f.name}` : f.name;
      const pub = await publishShare({
        id,
        name: labeled.slice(0, 180),
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
        author: note.trim() || 'lintel',
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not set the beam');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'lintel failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">lintel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a note across the door, or a file under it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            ship just the text, or rest a local file under the same title. discord reads the title from the share db.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            placeholder="what sits above the door"
            className="w-full mb-3 px-4 py-3 rounded-3xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 resize-none"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={shipNote} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
              {busy ? 'setting…' : 'ship the note'}
            </button>
            <label className="px-5 py-2.5 rounded-full bg-white/8 border border-white/10 text-sm cursor-pointer">
              rest a file under it
              <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            </label>
          </div>
          {warn && <p className="text-amber-300/90 text-xs">{warn}</p>}
          {err && <p className="text-red-400 text-xs">{err}</p>}
          {link && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>app: {link}</p>
              <p>discord embed (copied): {embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
