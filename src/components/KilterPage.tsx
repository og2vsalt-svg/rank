import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function KilterPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const warn = file && file.size > 40 * 1024 * 1024
    ? 'large companion. the ticket is still small, but reading the original may feel slow.'
    : undefined;

  const publish = async () => {
    if (!note.trim() && !file) return;
    setBusy(true);
    setErr('');
    try {
      const ticket = {
        desk: 'kilter',
        note: note.trim(),
        file: file
          ? { name: file.name, type: file.type || 'unknown', size: file.size, lastModified: file.lastModified }
          : null,
        at: new Date().toISOString(),
      };
      const body = JSON.stringify(ticket, null, 2);
      const dataUrl = `data:application/json;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = `kilter-${Date.now().toString(36)}`;
      const res = await publishShare({
        id,
        name: file ? `kilter-${file.name}.json` : 'kilter-note.json',
        type: 'application/json',
        size: body.length,
        dataUrl,
        author: 'kilter',
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish to the share db');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">kilter</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tilt a note against a local file.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            the public drop is a small json ticket: your note plus the file’s name, type, and size. bytes stay on this device. discord unfurls /s.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            placeholder="a short field note"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-neutral-200 outline-none focus:border-[#0a84ff]/50"
          />
          <label className="mt-3 block rounded-[24px] border border-dashed border-white/15 bg-black/20 px-6 py-8 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
            <input type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setEmbed(''); }} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'optional companion file'}</span>
          </label>
          {warn && <p className="text-amber-400/80 text-xs mt-3">{warn}</p>}
          <button disabled={busy || (!note.trim() && !file)} onClick={publish} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'publishing…' : 'publish ticket'}
          </button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="mt-4 text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
