import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function HearthPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');

  const go = async () => {
    setErr('');
    setLink('');
    setEmbed('');
    if (!note.trim() && !file) {
      setErr('write a note or attach a file');
      return;
    }
    if (file && file.size > 40 * 1024 * 1024) {
      setWarn('this attach is chunky. encoding may stall the tab. still going.');
    }
    setBusy(true);
    try {
      const blob = file
        ? file
        : new File([note], 'hearth-note.txt', { type: 'text/plain' });
      const dataUrl = await fileToDataUrl(blob);
      const id = uid();
      const res = await publishShare({
        id,
        name: blob.name,
        type: blob.type || 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'hearth',
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'hearth failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">hearth</p>
          <h1 className="text-3xl font-semibold mb-3">note plus a file, then a public link.</h1>
          <p className="text-neutral-400 text-sm mb-6">writes to the share db. discord unfurl hits /s/id so the card looks clean.</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="leave a note. if you skip the file this becomes the drop."
            className="w-full h-32 mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 resize-none"
          />
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0a84ff]/50 px-4 py-6 text-center mb-4">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-sm">{file ? file.name : 'optional attach'}</p>
            <p className="text-[11px] text-neutral-500 mt-1">no hard cap. huge files just warn about slowness.</p>
          </label>
          <button onClick={go} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'publishing…' : 'publish drop'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <div className="mt-5 space-y-1 text-xs text-neutral-400 break-all">
              <p>app: {link}</p>
              <p>discord embed: {embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
