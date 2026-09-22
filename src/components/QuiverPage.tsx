import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function QuiverPage() {
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<{ name: string; embed: string; warn?: string }[]>([]);
  const [msg, setMsg] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list || !list.length) return;
    setBusy(true);
    setMsg('');
    const next: { name: string; embed: string; warn?: string }[] = [];
    for (const file of Array.from(list)) {
      const warn = file.size > 8 * 1024 * 1024 ? 'large file. upload or preview may feel slow.' : undefined;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
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
      if (res.ok) {
        next.push({ name: file.name, embed: shareUrls(res.id || id).embed, warn: res.warn || warn });
      } else {
        setMsg(res.error || 'one of the drops missed the db');
      }
    }
    setLinks((prev) => [...next, ...prev]);
    setBusy(false);
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
          <p className="text-[#0a84ff] text-sm mb-2">quiver</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">batch drop into the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">each file goes to supabase via /api/share. discord embed urls come back ready to paste.</p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <span className="text-sm text-neutral-300">{busy ? 'uploading…' : 'drop a pile here'}</span>
          </label>
          {msg && <p className="text-xs text-amber-300/80 mt-4">{msg}</p>}
          <div className="mt-6 space-y-2">
            {links.map((l) => (
              <div key={l.embed} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-sm text-white mb-1">{l.name}</p>
                <p className="text-xs text-neutral-500 break-all">{l.embed}</p>
                {l.warn && <p className="text-xs text-amber-300/70 mt-1">{l.warn}</p>}
                <button
                  onClick={() => navigator.clipboard.writeText(l.embed)}
                  className="mt-2 text-xs text-[#0a84ff]"
                >
                  copy discord link
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
