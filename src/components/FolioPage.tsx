import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export default function FolioPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.username || '');
  const [bio, setBio] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ embed: string; app: string } | null>(null);

  const publish = async () => {
    setBusy(true);
    setErr('');
    try {
      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${name || 'folio'}</title><meta name="theme-color" content="#0a84ff"/></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,sans-serif;min-height:100vh;display:grid;place-items:center"><div style="max-width:420px;padding:32px;border-radius:28px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)"><p style="color:#0a84ff;font-size:13px;margin:0 0 8px">folio</p><h1 style="margin:0 0 8px;font-size:28px">${(name || 'untitled').replace(/</g, '')}</h1><p style="color:#a1a1aa;font-size:14px">${(bio || 'quiet card').replace(/</g, '')}</p>${link ? `<p style="margin-top:16px"><a href="${link.replace(/"/g, '')}" style="color:#0a84ff">${link.replace(/</g, '')}</a></p>` : ''}</div></body></html>`;
      const dataUrl = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(html)));
      const id = rid();
      const res = await publishShare({
        id,
        name: `${name || 'folio'}.html`,
        type: 'text/html',
        size: html.length,
        dataUrl,
        author: user?.username,
      });
      if (!res.ok) {
        setErr(res.error || 'could not park folio');
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
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">folio</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a quiet public card</h1>
          <p className="text-sm text-neutral-500 mb-6">not a vault. just a tiny html drop that discord can unfurl.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="display name" className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none mb-3" />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="one line about you" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-3 min-h-[90px]" />
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="optional url" className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <button disabled={busy} onClick={publish} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'parking…' : 'publish card'}</button>
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
