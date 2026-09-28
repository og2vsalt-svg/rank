import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, publishShare, shareUrls } from '../lib/cloudShare';

function roomCode() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function HearthPage() {
  const { navigate } = useRouter();
  const [code, setCode] = useState(roomCode);
  const [join, setJoin] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [found, setFound] = useState<{ name: string; size: number; type: string; url: string; id: string } | null>(null);

  const send = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setWarn(file.size > 12 * 1024 * 1024 ? 'chunky file. the tab may lag while it encodes. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = `hearth-${code}`;
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'hearth',
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish to the share db');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'send failed');
    } finally {
      setBusy(false);
    }
  };

  const pull = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `hearth-${join.trim().toLowerCase()}`;
    setErr('');
    setFound(null);
    setBusy(true);
    try {
      const meta = await fetchShare(id);
      if (!meta) {
        setErr('nothing on that hearth yet.');
        return;
      }
      setFound({ id: meta.id, name: meta.name, size: meta.size, type: meta.type, url: meta.url });
    } catch {
      setErr('could not reach the share db.');
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
          <p className="text-[#0a84ff] text-sm mb-2">hearth</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hand a file across devices.</h1>
          <p className="text-neutral-400 text-sm mb-8">
            not a vault grid. one code, one drop in the share database. discord unfurls the /s card.
          </p>
          <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-6 mb-6">
            <p className="text-xs text-neutral-500 mb-2">this hearth</p>
            <p className="text-4xl font-semibold tracking-[0.18em] uppercase mb-4">{code}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              <button type="button" onClick={() => { setCode(roomCode()); setLink(''); }} className="px-4 py-2 rounded-full bg-white/5 text-sm">new code</button>
              <button type="button" onClick={() => navigator.clipboard.writeText(code).catch(() => {})} className="px-4 py-2 rounded-full bg-white/5 text-sm">copy code</button>
            </div>
            <label className="block cursor-pointer rounded-[22px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}>
              <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
              <p className="text-white font-medium">{busy ? 'warming the hearth…' : 'drop a file on this code'}</p>
              <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
            </label>
          </div>
          <form onSubmit={pull} className="flex gap-2 mb-4">
            <input value={join} onChange={(e) => setJoin(e.target.value.toLowerCase())} placeholder="enter a code" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" maxLength={8} />
            <button type="submit" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">pull</button>
          </form>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          {link && <p className="text-xs text-neutral-500 mb-3 break-all">discord embed copied: {link}</p>}
          {found && (
            <div className="rounded-2xl bg-black/30 p-4">
              <p className="text-sm text-white mb-1">{found.name}</p>
              <p className="text-xs text-neutral-500 mb-3">{formatBytes(found.size)} · {found.type || 'file'}</p>
              <div className="flex flex-wrap gap-2">
                <a href={found.url} download={found.name} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">download</a>
                <button onClick={() => navigate('share', found.id)} className="px-4 py-2 rounded-full bg-white/5 text-sm">open share</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
