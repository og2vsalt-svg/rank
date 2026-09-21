import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export default function ParcelPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [hours, setHours] = useState('24');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ embed: string; app: string } | null>(null);

  const onPick = (f?: File) => {
    if (!f) return;
    setFile(f);
    setDone(null);
    setErr('');
    setWarn(f.size > 8 * 1024 * 1024 ? 'chunky file. still sending, tab might nap.' : '');
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = rid();
      const hrs = Number(hours) || 0;
      const expiresAt = hrs > 0 ? new Date(Date.now() + hrs * 3600 * 1000).toISOString() : undefined;
      const res = await publishShare({
        id,
        name: note.trim() ? `${file.name} — ${note.trim()}` : file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        expiresAt,
        author: user?.username,
      });
      if (!res.ok) {
        setErr(res.error || 'could not ship the parcel');
        return;
      }
      const urls = shareUrls(res.id || id);
      setDone({ embed: urls.embed, app: urls.app });
    } catch (e: any) {
      setErr(e?.message || 'failed');
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
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">parcel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">ship a timed drop</h1>
          <p className="text-sm text-neutral-500 mb-6">local file goes into the share db with an optional expiry. discord unfurls /s like a product card.</p>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
          <button onClick={() => inputRef.current?.click()} className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-sm text-neutral-400">
            {file ? file.name : 'pick a file from this machine'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional note on the label" className="mt-4 w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="hours until it fades (0 = keep)" className="mt-3 w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <button disabled={!file || busy} onClick={send} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'shipping…' : 'ship parcel'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {done && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="break-all text-[#0a84ff]">{done.embed}</p>
              <button onClick={() => navigator.clipboard.writeText(done.embed)} className="px-4 py-2 rounded-full bg-white/5 text-sm">copy discord link</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
