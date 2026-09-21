import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export default function MirrorPage() {
  const [src, setSrc] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [done, setDone] = useState<{ embed: string; app: string } | null>(null);

  const parseId = (raw: string) => {
    const t = raw.trim();
    const m = t.match(/(?:[#?&]f=|\/s\/|\/file\/)([A-Za-z0-9_-]+)/);
    return m ? m[1] : t;
  };

  const run = async () => {
    setBusy(true);
    setErr('');
    setDone(null);
    try {
      const id = parseId(src);
      if (!id) {
        setErr('need a share id or /s/ link');
        return;
      }
      const meta = await fetchShare(id);
      if (!meta) {
        setErr('could not find that drop');
        return;
      }
      if (meta.size > 8 * 1024 * 1024) {
        setWarn('chunky source. remirror still runs, tab might feel sleepy. no hard cap.');
      }
      let dataUrl = meta.url;
      if (!dataUrl.startsWith('data:')) {
        const blob = await fetch(meta.url).then((r) => r.blob());
        dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('read failed'));
          r.readAsDataURL(blob);
        });
      }
      const nid = rid();
      const res = await publishShare({
        id: nid,
        name: meta.name,
        type: meta.type,
        size: meta.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'mirror failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id || nid);
      setDone({ embed: urls.embed, app: urls.app });
    } catch (e: any) {
      setErr(e?.message || 'mirror failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">mirror</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">clone a live drop</h1>
          <p className="text-sm text-neutral-500 mb-6">paste an id or discord /s/ url. we copy it into a fresh share so you can hand out a new embed.</p>
          <input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="id or https://…/s/abc" className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <button disabled={busy} onClick={run} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'mirroring…' : 'make a copy'}</button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {done && (
            <div className="mt-6 text-sm space-y-1">
              <p className="text-neutral-400 break-all">{done.app}</p>
              <p className="text-[#0a84ff] break-all">{done.embed}</p>
              <button onClick={() => navigator.clipboard.writeText(done.embed)} className="mt-2 px-4 py-2 rounded-full bg-white/5 text-sm">copy discord link</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
