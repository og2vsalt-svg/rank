import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function LintelPage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [meta, setMeta] = useState<CloudMeta | null>(null);
  const [copied, setCopied] = useState('');

  const load = async (raw?: string) => {
    const next = (raw ?? id).trim();
    if (!next) return;
    setBusy(true);
    setErr('');
    setMeta(null);
    try {
      const row = await fetchShare(next);
      if (!row) setErr('no live drop for that id.');
      else setMeta(row);
    } catch (e: any) {
      setErr(e?.message || 'could not reach the share db');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
    } catch {
      setCopied(url);
    }
  };

  const urls = meta ? shareUrls(meta.id) : null;

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
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read the beam over a public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            look up a share id and see the same title, size, and discord /s card a friend would unfurl. nothing new is uploaded.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
            className="flex gap-2"
          >
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <button type="submit" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'reading…' : 'read'}
            </button>
          </form>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {meta && urls && (
            <div className="mt-7 space-y-4">
              <div className="rounded-[24px] bg-black/25 border border-white/8 p-5">
                <p className="text-[11px] text-neutral-500 mb-1">discord card</p>
                <p className="text-white font-medium">{meta.name}</p>
                <p className="text-sm text-neutral-400 mt-1">
                  {(meta.type || 'file').split(';')[0]} · {pretty(meta.size)}
                  {meta.author ? ` · ${meta.author}` : ''}
                </p>
              </div>
              {meta.type?.startsWith('image/') && meta.url?.startsWith('http') && (
                <img src={meta.url} alt="" className="w-full rounded-2xl" />
              )}
              <p className="text-xs text-neutral-500 break-all">discord: {urls.embed}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => copy(urls.embed)} className="px-4 py-2 rounded-full bg-white/5 text-sm">
                  copy /s card
                </button>
                <button onClick={() => copy(urls.app)} className="px-4 py-2 rounded-full bg-white/5 text-sm">
                  copy app link
                </button>
              </div>
              {copied && <p className="text-xs text-neutral-500 break-all">copied {copied}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
