import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function InletPage() {
  const [token, setToken] = useState(() => uid());
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');

  const requestUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#inlet?f=${token}`
      : `#inlet?f=${token}`;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr('');
    setWarn(file.size > 20 * 1024 * 1024 ? 'big file. still going through, tab might nap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readFile(file);
      const res = await publishShare({
        id: token,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: note || undefined,
      });
      if (!res.ok) {
        setErr(res.error || 'upload missed the db');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setLink(shareUrls(res.id || token).embed);
    } catch (e: any) {
      setErr(e?.message || 'could not read file');
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
          <p className="text-[#0a84ff] text-sm mb-2">inlet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">ask someone to send a file in.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            this is not a vault. you mint a quiet inbox token, they drop a local file into the share db, you get the discord embed.
          </p>
          <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-4 mb-5">
            <p className="text-[11px] text-neutral-500 mb-1">request link</p>
            <p className="text-xs text-neutral-300 break-all">{requestUrl}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigator.clipboard.writeText(requestUrl)}
                className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
              >
                copy request
              </button>
              <button
                onClick={() => setToken(uid())}
                className="px-3 py-1.5 rounded-full bg-white/5 text-xs"
              >
                new token
              </button>
            </div>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional note for the sender"
            className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'sending in…' : 'drop a file into this inlet'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard cap. huge files just get a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/8 p-4">
              <p className="text-[11px] text-neutral-500">discord embed</p>
              <p className="text-xs text-neutral-300 break-all mt-1">{link}</p>
              <button
                onClick={() => navigator.clipboard.writeText(link)}
                className="mt-3 px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
              >
                copy embed
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
