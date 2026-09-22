import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function WispPage() {
  const [note, setNote] = useState('');
  const [mins, setMins] = useState(30);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const send = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setErr('');
    const expiresAt = new Date(Date.now() + mins * 60 * 1000).toISOString();
    const body = note;
    const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
    const id = 'wisp-' + Date.now().toString(36);
    const res = await publishShare({
      id,
      name: 'wisp.txt',
      type: 'text/plain',
      size: body.length,
      dataUrl,
      expiresAt,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'wisp missed the db');
      return;
    }
    setLink(shareUrls(res.id || id).embed);
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
          <p className="text-[#0a84ff] text-sm mb-2">wisp</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a note that fades on its own.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. just a short-lived drop in the share db. discord cards pick it up until the clock runs out.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={7}
            placeholder="say it once"
            className="w-full rounded-2xl bg-white/5 border border-white/10 text-sm p-4 outline-none mb-4"
          />
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {[10, 30, 120, 1440].map((m) => (
              <button
                key={m}
                onClick={() => setMins(m)}
                className={`px-3.5 py-1.5 rounded-full text-sm transition-colors ${
                  mins === m ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'
                }`}
              >
                {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
          <button onClick={send} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
            {busy ? 'sending…' : 'release wisp'}
          </button>
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
