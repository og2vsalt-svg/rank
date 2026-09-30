import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function phrase() {
  const a = ['quiet', 'salt', 'ember', 'linen', 'cedar', 'amber', 'hollow', 'silver'];
  const b = ['hawse', 'cleat', 'sill', 'ridge', 'cove', 'lantern', 'harbor', 'glen'];
  const pick = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)];
  return `${pick(a)}-${pick(b)}-${Math.floor(100 + Math.random() * 900)}`;
}

export default function HawsePage() {
  const [note, setNote] = useState('');
  const [pass, setPass] = useState(phrase());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const send = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const file = new File([note], 'hawse.txt', { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: 'text/plain',
        size: file.size,
        dataUrl,
        lockPass: pass,
        author: 'hawse',
      });
      if (!res.ok) throw new Error(res.error || 'send failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(`${urls.embed} · phrase: ${pass}`);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'send failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">hawse</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">thread a note through a spoken phrase.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            the file still lives on the share db. the phrase is a soft lock so the card can travel on discord without shouting.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-4"
            placeholder="a note that should not sit in the vault"
          />
          <div className="flex items-center gap-2 mb-5">
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none"
            />
            <button onClick={() => setPass(phrase())} className="text-xs text-neutral-400 px-3 py-2 rounded-full hover:bg-white/5">
              new phrase
            </button>
          </div>
          <button
            disabled={busy || !note.trim()}
            onClick={send}
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'threading…' : 'send through the hawse'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 break-all">
              discord (copied): {embed}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
