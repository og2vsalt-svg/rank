import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function FolioPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const onFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setLink('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky file. this tab may nap while it encodes. no hard cap.' : '');
    try {
      const dataUrl = await readFile(file);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const name = title.trim() ? `${title.trim()}-${file.name}` : file.name;
      const res = await publishShare({
        id,
        name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: user?.username || undefined,
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'folio failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">folio</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">title a drop, then send it.</h1>
          <p className="text-neutral-400 text-sm mb-6">not another vault grid. just a cover line plus one local file into the share db. discord uses the /s card.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="cover title"
            className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional note. stays on this page, not in the file."
            rows={3}
            className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40 resize-none"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files?.[0]);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. just a slowness warning if it is huge.</p>
          </label>
          {note && <p className="text-xs text-neutral-500 mt-4">kept locally: {note}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && (
            <div className="mt-5 space-y-1 text-xs text-neutral-400 break-all">
              <p>embed (copied): {embed}</p>
              <p>app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
