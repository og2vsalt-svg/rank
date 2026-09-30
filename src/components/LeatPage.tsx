import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File, onTick?: (pct: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onprogress = (e) => {
      if (e.lengthComputable && onTick) onTick(Math.round((e.loaded / e.total) * 100));
    };
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function LeatPage() {
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setLink('');
    setEmbed('');
    setPct(0);
    setMeta({ name: f.name, size: f.size });
    setWarn(f.size > 12 * 1024 * 1024 ? 'large drop. the leat may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(f, setPct);
      setPct(100);
      const id = uid();
      const pub = await publishShare({
        id,
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
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
      setErr(e?.message || 'leat failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">leat</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">channel one local file into the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. a single mill race. progress stays in the tab. discord unfurls the /s card.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-colors duration-300">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'the leat is running…' : 'drop a file on the race'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size cap. only a slowness ping if it is huge.</p>
          </label>
          {(busy || pct > 0) && (
            <div className="mt-5">
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full bg-[#0a84ff]"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-2">
                {meta ? `${meta.name} · ${pretty(meta.size)} · ${pct}%` : `${pct}%`}
              </p>
            </div>
          )}
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
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
