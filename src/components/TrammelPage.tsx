import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function TrammelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [pass, setPass] = useState('');
  const [hours, setHours] = useState('72');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    const n = Number(hours);
    const expiresAt = Number.isFinite(n) && n > 0 ? new Date(Date.now() + n * 3600 * 1000).toISOString() : null;
    try {
      const pub = await publishLocalFile(file, { caption, author, lockPass: pass, expiresAt, color: '#0A84FF' });
      if (!pub.ok || !pub.id) {
        setErr(pub.error || 'could not file the drop');
        return;
      }
      setWarn(pub.warn || (file.size > 40 * 1024 * 1024 ? 'large drop. the tab may feel slow. it was not refused.' : ''));
      const urls = shareUrls(pub.id);
      setLink(urls.embed || pub.embed || `${location.origin}/s/${pub.id}`);
      try { await navigator.clipboard.writeText(urls.embed || pub.embed || ''); } catch { /* optional */ }
    } catch (e: any) {
      setErr(e?.message || 'trammel failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">trammel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a drop with a clock.</h1>
          <p className="text-neutral-400 text-sm mb-6">the local file goes into the share database. optional pass, optional hours. Discord gets /s. no size cap — only a warning if it will feel slow.</p>
          <label className="lift block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files?.[0] || null); setLink(''); }}>
            <input type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setLink(''); }} />
            <span className="text-neutral-200">{file ? file.name : 'choose a local file'}</span>
          </label>
          <div className="grid gap-3 mt-5">
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="card line" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
            <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="pass, optional" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
            <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="hours until it expires" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
          </div>
          {warn && <p className="text-amber-200/90 text-sm mt-4">{warn}</p>}
          {err && <p className="text-red-300 text-sm mt-4">{err}</p>}
          <button disabled={busy || !file} onClick={send} className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'filing…' : 'file it'}</button>
          {link && <p className="mt-5 text-sm break-all"><a className="text-[#0a84ff]" href={link}>{link}</a></p>}
        </motion.div>
      </div>
    </div>
  );
}
