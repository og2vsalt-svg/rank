import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

type Item = { id: string; name: string; size: number; type: string; embed: string; warn?: string };

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function CanopyPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [bundle, setBundle] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list || !list.length) return;
    setBusy(true);
    setErr('');
    const next: Item[] = [];
    let slow = '';
    for (const file of Array.from(list)) {
      if (file.size > 40 * 1024 * 1024) {
        slow = 'big batch. the tab may feel sleepy. no hard cap.';
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'one file missed the db');
        continue;
      }
      if (res.warn) slow = res.warn;
      next.push({
        id: res.id || id,
        name: file.name,
        size: file.size,
        type: file.type,
        embed: shareUrls(res.id || id).embed,
        warn: res.warn,
      });
    }
    setItems((prev) => [...next, ...prev]);
    setWarn(slow);
    setBusy(false);
  };

  const publishBundle = async () => {
    if (!items.length) return;
    setBusy(true);
    const body = JSON.stringify(
      { kind: 'rankvault-canopy', createdAt: new Date().toISOString(), items },
      null,
      2,
    );
    const dataUrl = `data:application/json;base64,${btoa(unescape(encodeURIComponent(body)))}`;
    const id = 'canopy-' + Date.now().toString(36);
    const res = await publishShare({
      id,
      name: 'canopy.json',
      type: 'application/json',
      size: body.length,
      dataUrl,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'bundle missed the db');
      return;
    }
    if (res.warn) setWarn(res.warn);
    setBundle(shareUrls(res.id || id).embed);
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
          <p className="text-[#0a84ff] text-sm mb-2">canopy</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop a handful. we hang them as one tree.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            each file hits the share db on its own. then we stitch a bundle card with a discord embed. no hard size cap, just a nudge if the tab starts lagging.
          </p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <span className="text-sm text-neutral-300">{busy ? 'uploading…' : 'drop files or click'}</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {items.length > 0 && (
            <>
              <ul className="mt-6 space-y-2">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-neutral-200 truncate">{it.name}</span>
                    <span className="text-neutral-500 shrink-0">{formatBytes(it.size)}</span>
                  </li>
                ))}
              </ul>
              <button onClick={publishBundle} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
                publish canopy card
              </button>
            </>
          )}
          {bundle && (
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/8 p-4">
              <p className="text-[11px] text-neutral-500">discord embed</p>
              <p className="text-xs text-neutral-300 break-all mt-1">{bundle}</p>
              <button
                onClick={() => navigator.clipboard.writeText(bundle)}
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
