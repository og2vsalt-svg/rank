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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

type Drop = {
  name: string;
  size: number;
  type: string;
  embed: string;
  app: string;
  warn?: string;
};

export default function PorchlightPage() {
  const [drop, setDrop] = useState<Drop | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [copied, setCopied] = useState('');
  const [hover, setHover] = useState(false);

  const take = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setCopied('');
    setWarn(file.size > 12 * 1024 * 1024 ? 'heavy file. the tab may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = 'porch-' + uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'porchlight',
      });
      if (!res.ok) throw new Error(res.error || 'publish failed');
      const urls = shareUrls(res.id || id);
      setDrop({
        name: file.name,
        size: file.size,
        type: file.type || 'file',
        embed: urls.embed,
        app: urls.app,
        warn: res.warn,
      });
      try {
        await navigator.clipboard.writeText(urls.embed);
        setCopied(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not publish');
      setDrop(null);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">porchlight</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">leave a file on the step</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            uploads a local file into the share database and hands you a discord-ready /s card.
            not a vault grid. no hard file cap — only a slowness ping if it is huge.
          </p>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setHover(true);
            }}
            onDragLeave={() => setHover(false)}
            onDrop={(e) => {
              e.preventDefault();
              setHover(false);
              void take(e.dataTransfer.files);
            }}
            className={`block rounded-3xl border border-dashed px-6 py-12 text-center cursor-pointer transition-all duration-300 ${
              hover ? 'border-[#0a84ff]/70 bg-[#0a84ff]/8' : 'border-white/12 bg-white/[0.03]'
            }`}
          >
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                void take(e.target.files);
                e.currentTarget.value = '';
              }}
            />
            <p className="text-sm text-neutral-200">{busy ? 'publishing…' : 'drop a file or click to pick one'}</p>
            <p className="text-xs text-neutral-500 mt-2">lands in supabase. vercel blob if a token is set.</p>
          </label>

          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}

          {drop && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 rounded-3xl overflow-hidden border border-white/10"
            >
              <div className="h-28 bg-gradient-to-br from-[#0a84ff]/30 via-[#1c1c1e] to-[#111] flex items-end px-5 pb-4">
                <p className="text-xs tracking-wide text-white/70">rankvault · public drop</p>
              </div>
              <div className="p-5 bg-white/[0.03]">
                <p className="text-lg font-medium tracking-tight">{drop.name}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {pretty(drop.size)} · {drop.type || 'file'}
                </p>
                {drop.warn && <p className="text-xs text-amber-300/80 mt-2">{drop.warn}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => copy(drop.embed)}
                    className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium"
                  >
                    {copied === drop.embed ? 'copied /s card' : 'copy discord card'}
                  </button>
                  <button
                    onClick={() => copy(drop.app)}
                    className="px-4 py-2 rounded-full bg-white/8 text-sm text-neutral-200"
                  >
                    copy app link
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-neutral-500 break-all">{drop.embed}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
