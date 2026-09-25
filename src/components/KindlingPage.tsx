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
    r.onerror = () => reject(r.error || new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function KindlingPage() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const go = async () => {
    if (!file) {
      setErr('pick a local file first');
      return;
    }
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'big file. encoding might lag. still no cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const name = note.trim() ? `${note.trim().slice(0, 40)} — ${file.name}` : file.name;
      const res = await publishShare({
        id,
        name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: note.trim() || undefined,
      });
      if (!res.ok) {
        setErr(res.error || 'kindling failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'kindling failed');
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
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">kindling</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">note plus a file, then spark a public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault grid. the note rides as author metadata. discord gets a clean /s card.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition-all duration-300 mb-4">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setEmbed('');
                setApp('');
              }}
            />
            <p className="text-white font-medium">{file ? file.name : 'drop or pick a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when the tab might stall.</p>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="optional spark note"
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/40"
          />
          <button
            onClick={go}
            disabled={busy}
            className="mt-4 w-full rounded-full bg-white text-black py-2.5 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition-colors"
          >
            {busy ? 'sparking…' : 'publish drop'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
