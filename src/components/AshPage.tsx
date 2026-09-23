import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export default function AshPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hours, setHours] = useState('24');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [msg, setMsg] = useState('');
  const [warn, setWarn] = useState('');

  const go = async () => {
    if (!file) return;
    setBusy(true);
    setMsg('');
    setWarn('');
    try {
      if (file.size > 20 * 1024 * 1024) setWarn('large drop. preview clients may feel slow. still sending.');
      const dataUrl = await readFile(file);
      const id = uid();
      const hrs = Math.max(0, Number(hours) || 0);
      const expiresAt = hrs > 0 ? new Date(Date.now() + hrs * 3600 * 1000).toISOString() : null;
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        lockPass: pass || undefined,
        expiresAt,
      });
      if (!res.ok) setMsg(res.error || 'could not write share');
      else {
        setEmbed(shareUrls(res.id || id).embed);
        setMsg(hrs ? `live for about ${hrs}h then the embed goes dark.` : 'no expiry. lives until you hide it.');
        if (res.warn) setWarn(res.warn);
      }
    } catch (e: any) {
      setMsg(e?.message || 'read failed');
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
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">ash</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">timed public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            local file → share db with an optional clock and passcode. not the vault. discord unfurls /s/id.
          </p>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-neutral-400 mb-4" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="text-xs text-neutral-500">
              hours live
              <input
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0a84ff]/50"
              />
            </label>
            <label className="text-xs text-neutral-500">
              optional pass
              <input
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0a84ff]/50"
              />
            </label>
          </div>
          {warn && <p className="text-amber-300/90 text-xs mb-3">{warn}</p>}
          <button disabled={!file || busy} onClick={go} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'writing…' : 'publish ash drop'}
          </button>
          {msg && <p className="text-sm text-neutral-400 mt-4">{msg}</p>}
          {embed && (
            <p className="text-xs text-neutral-500 mt-3 break-all">
              {embed}{' '}
              <button className="underline" onClick={() => navigator.clipboard.writeText(embed)}>
                copy
              </button>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
