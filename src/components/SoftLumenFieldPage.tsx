import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Share = { id: string; name: string; caption?: string | null; color?: string | null; created_at: string; file_url?: string };

export default function SoftLumenFieldPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#34C759');
  const [busy, setBusy] = useState(false);
  const [warns, setWarns] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [shares, setShares] = useState<Share[]>([]);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/public_shares?select=id,name,caption,meta,created_at,file_url&order=created_at.desc&limit=20`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      });
      if (r.ok) {
        const rows = await r.json();
        setShares(rows.filter((row: any) => row.meta?.desk === 'softlumenfield' || true).slice(0, 12));
      }
    } catch {}
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const w = arr.filter(f => f.size > 40 * 1024 * 1024).map(f => `${f.name} is large — upload may feel slow. No hard limit.`);
    setWarns(w);
  };

  const shareAll = async () => {
    if (files.length === 0 && !note.trim()) return setErr('drop files or leave a note');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || `field light · ${file.name}`,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softlumenfield' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(prev => prev || res.error || 'one upload slowed');
      }
      if (note.trim() && files.length === 0) {
        const blob = new Blob([note], { type: 'text/plain' });
        const file = new File([blob], 'note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(file, {
          caption: note.trim(),
          color: accent,
          cardTitle: 'quiet field note',
          meta: { desk: 'softlumenfield' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      setWarns([]);
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[32px] p-8 sm:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Soft Lumen Field</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3 leading-tight">Light drifting across an open field.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop one or many local files. Leave a shared note. Soft cards of light gently float and settle in your accent color, like sunlight drifting across still grass. Files upload to storage and public_shares. Every share link carries a polished Discord embed. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
            className="border border-dashed border-white/15 rounded-[22px] p-8 text-center mb-6 cursor-pointer hover:border-white/30 transition"
            onClick={() => document.getElementById('file-input-field')?.click()}
          >
            <p className="text-neutral-300 text-[14px]">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop files or click to choose'}</p>
            <input id="file-input-field" type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
          </div>

          {warns.length > 0 && (
            <div className="mb-4 space-y-1">
              {warns.map((w, i) => <p key={i} className="text-[12px] text-amber-300/90">{w}</p>)}
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet note that drifts with the light…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent color</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={shareAll}
            disabled={busy || (files.length === 0 && !note.trim())}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : 'Share the field'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 space-y-2">
                {links.map((l, i) => (
                  <motion.a
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    href={l}
                    className="block text-[13px] break-all"
                    style={{ color: accent }}
                  >
                    {l}
                  </motion.a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="mt-14 space-y-4">
          <AnimatePresence>
            {shares.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 40, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 80, damping: 16 }}
                className="glass rounded-[24px] p-6"
                style={{ borderColor: s.color || accent }}
              >
                <p className="text-[15px] font-medium text-neutral-100 mb-1">{s.name}</p>
                {s.caption && <p className="text-[13px] text-neutral-400 leading-relaxed">{s.caption}</p>}
                <p className="text-[11px] text-neutral-500 mt-3">{new Date(s.created_at).toLocaleDateString()}</p>
                <a href={`/s/${s.id}`} className="text-[12px] mt-2 inline-block" style={{ color: s.color || accent }}>open share</a>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
