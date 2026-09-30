import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function digest(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

type Slot = { file: File; hash: string } | null;

export default function SolsticePage() {
  const [a, setA] = useState<Slot>(null);
  const [b, setB] = useState<Slot>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const load = async (which: 'a' | 'b', list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setLink('');
    if (f.size > 20 * 1024 * 1024) setWarn('large file. hashing then publishing may feel slow.');
    const hash = await digest(f);
    const slot = { file: f, hash };
    if (which === 'a') setA(slot);
    else setB(slot);
  };

  const ship = async (slot: Slot) => {
    if (!slot) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(slot.file);
      const id = uid();
      const pub = await publishShare({
        id,
        name: slot.file.name,
        type: slot.file.type || 'application/octet-stream',
        size: slot.file.size,
        dataUrl,
        author: slot.hash.slice(0, 12),
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
      setErr(e?.message || 'solstice failed');
    } finally {
      setBusy(false);
    }
  };

  const same = a && b && a.hash === b.hash;

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
          <p className="text-[#0a84ff] text-sm mb-2">solstice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hash two locals. ship the one you keep.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            sha-256 both sides so you can tell twins apart. then publish only the chosen file to the share db.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {(['a', 'b'] as const).map((side) => {
              const slot = side === 'a' ? a : b;
              return (
                <label key={side} className="rounded-3xl border border-dashed border-white/15 p-5 cursor-pointer hover:border-[#0a84ff]/40 transition">
                  <input type="file" className="hidden" onChange={(e) => load(side, e.target.files)} />
                  <p className="text-xs text-neutral-500 mb-1">side {side}</p>
                  {slot ? (
                    <>
                      <p className="text-sm text-white truncate">{slot.file.name}</p>
                      <p className="text-[11px] text-neutral-500 mt-1 font-mono break-all">{slot.hash.slice(0, 24)}…</p>
                    </>
                  ) : (
                    <p className="text-sm text-neutral-400">drop a file</p>
                  )}
                </label>
              );
            })}
          </div>
          {same && <p className="text-xs text-emerald-300/80 mb-4">same hash — these two are twins.</p>}
          <div className="flex flex-wrap gap-2">
            <button disabled={!a || busy} onClick={() => ship(a)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
              ship side a
            </button>
            <button disabled={!b || busy} onClick={() => ship(b)} className="px-5 py-2.5 rounded-full bg-white/10 text-sm disabled:opacity-40">
              ship side b
            </button>
          </div>
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
