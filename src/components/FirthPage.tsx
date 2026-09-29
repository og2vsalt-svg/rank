import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function FirthPage() {
  const [note, setNote] = useState('');
  const [pass, setPass] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const onFile = (f: File | null) => {
    setFile(f);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'chunky wrap. no cap, the encode may hitch.' : '');
  };

  const publish = async () => {
    setErr('');
    setLink('');
    const blob = file
      ? file
      : new File([note || 'empty firth'], 'firth.txt', { type: 'text/plain' });
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const res = await publishShare({
        id: uid(),
        name: blob.name,
        type: blob.type || 'text/plain',
        size: blob.size,
        dataUrl,
        lockPass: pass || undefined,
        author: 'firth',
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id!);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'firth failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">private wrap</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">firth</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            tuck a note or a local file behind an optional passphrase, then publish to the share table. discord unfurls the /s card.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a short note if you skip the file"
            className="w-full min-h-28 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-4"
          />
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="optional passphrase"
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-4"
          />
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-6 text-center mb-4">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? file.name : 'attach a local file'}</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button
            onClick={publish}
            disabled={busy}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'sealing…' : 'seal and publish'}
          </button>
          {link && (
            <p className="text-xs text-neutral-400 mt-4 break-all">discord card copied · {link}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
