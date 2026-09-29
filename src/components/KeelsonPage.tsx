import { useMemo, useState } from 'react';
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
    r.onerror = () => reject(new Error('could not read that file'));
    r.readAsDataURL(file);
  });
}

type Shot = {
  id: string;
  name: string;
  size: number;
  type: string;
  caption: string;
  embed: string;
  app: string;
  warn?: string;
};

export default function KeelsonPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [lock, setLock] = useState('');
  const [hours, setHours] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [shot, setShot] = useState<Shot | null>(null);
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState('');

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  const take = (list: FileList | null) => {
    const next = list?.[0];
    if (!next) return;
    setFile(next);
    setErr('');
    setShot(null);
    setWarn(next.size > 12 * 1024 * 1024 ? 'heavy file. encoding may feel slow. no hard cap.' : '');
  };

  const publish = async () => {
    if (!file) {
      setErr('pick a local file first');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = 'keel-' + uid();
      const hoursNum = Number(hours);
      const expiresAt =
        hoursNum > 0 && Number.isFinite(hoursNum)
          ? new Date(Date.now() + hoursNum * 60 * 60 * 1000).toISOString()
          : null;
      const res = await publishShare({
        id,
        name: caption.trim() ? `${caption.trim()} — ${file.name}` : file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        lockPass: lock.trim() || undefined,
        expiresAt,
        author: 'keelson',
      });
      if (!res.ok) throw new Error(res.error || 'publish failed');
      const urls = shareUrls(res.id || id);
      setShot({
        id: res.id || id,
        name: file.name,
        size: file.size,
        type: file.type || 'file',
        caption: caption.trim(),
        embed: urls.embed,
        app: urls.app,
        warn: res.warn,
      });
      try {
        await navigator.clipboard.writeText(urls.embed);
        setCopied(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not publish to the share db');
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
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[36px] p-8 sm:p-10"
        >
          <p className="text-[#0a84ff] text-sm mb-2">keelson</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">host a file, keep the card quiet.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8 max-w-xl">
            not a vault grid. one local file goes into the public share table. discord reads the /s card. big files only warn about slowness.
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
              take(e.dataTransfer.files);
            }}
            className={`block cursor-pointer rounded-[28px] border border-dashed p-10 text-center transition-all duration-500 ${
              hover ? 'border-[#0a84ff]/70 bg-[#0a84ff]/8 scale-[1.01]' : 'border-white/12 bg-white/[0.03]'
            }`}
          >
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                take(e.target.files);
                e.currentTarget.value = '';
              }}
            />
            <p className="text-sm text-neutral-200">{file ? file.name : 'drop a file or click to pick one'}</p>
            <p className="text-xs text-neutral-500 mt-2">
              {file ? `${pretty(file.size)} · ${file.type || 'file'}` : 'lands in supabase. vercel blob if a token is set.'}
            </p>
          </label>

          {file && file.type.startsWith('image/') && previewUrl && (
            <motion.img
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              src={previewUrl}
              alt=""
              className="mt-5 w-full max-h-56 object-cover rounded-[24px] border border-white/8"
            />
          )}

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional caption"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <input
              value={lock}
              onChange={(e) => setLock(e.target.value)}
              placeholder="optional lock phrase"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="hours until it expires (blank = keep)"
              inputMode="numeric"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 sm:col-span-2"
            />
          </div>

          <button
            onClick={publish}
            disabled={busy || !file}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200"
          >
            {busy ? 'publishing…' : 'publish to share db'}
          </button>

          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}

          {shot && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 rounded-[28px] overflow-hidden border border-white/10"
            >
              <div className="h-32 bg-gradient-to-br from-[#0a84ff]/35 via-[#1c1c1e] to-[#0b0b0c] flex items-end px-6 pb-4">
                <p className="text-xs tracking-wide text-white/70">rankvault · discord card</p>
              </div>
              <div className="p-6 bg-white/[0.03]">
                <p className="text-lg font-medium tracking-tight">{shot.caption || shot.name}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {pretty(shot.size)} · {shot.type}
                </p>
                {shot.warn && <p className="text-xs text-amber-300/80 mt-2">{shot.warn}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => copy(shot.embed)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">
                    {copied === shot.embed ? 'copied /s card' : 'copy discord card'}
                  </button>
                  <button onClick={() => copy(shot.app)} className="px-4 py-2 rounded-full bg-white/8 text-sm text-neutral-200">
                    copy app link
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-neutral-500 break-all">{shot.embed}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
