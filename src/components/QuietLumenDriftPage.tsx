import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Note = { id: string; body: string; created_at: string };

export default function QuietLumenDriftPage() {
  const [text, setText] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/whispers?select=id,body,created_at&order=created_at.desc&limit=12`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      });
      if (r.ok) setNotes(await r.json());
    } catch {}
  };

  useEffect(() => { refresh(); }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped].slice(0, 8));
    const large = dropped.some(f => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'Some files are large. Uploads may feel slow. No hard limits.' : null);
  };

  const save = async () => {
    if (!text.trim() && files.length === 0) return setErr('add a note or drop files');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const newLinks: string[] = [];
      for (const f of files) {
        const res = await publishLocalFile(f, {
          caption: text.trim() || 'drifting from quiet lumen',
          color: accent,
          cardTitle: f.name,
          meta: { desk: 'quietlumendrift' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'upload slowed');
      }
      if (text.trim()) {
        await fetch(`${SB_URL}/rest/v1/whispers`, {
          method: 'POST',
          headers: {
            apikey: SB_KEY,
            Authorization: `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ body: text.trim().slice(0, 280), kind: 'drift' }),
        });
        setText('');
      }
      setFiles([]);
      setLinks(newLinks);
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something drifted');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      <Navbar />
      {/* Drifting orbs */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 80 + i * 20,
            height: 80 + i * 20,
            background: accent,
            opacity: 0.08,
            left: `${15 + i * 12}%`,
            top: `${20 + (i % 3) * 15}%`,
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Lumen Drift</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">Light that drifts, shares that settle.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Soft orbs of your accent gently drift across still space. Drop multiple local files or leave a quiet note. Files upload to storage and public_shares. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <div
            ref={dropRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-white/15 rounded-[24px] p-8 text-center mb-5 hover:border-white/25 transition cursor-pointer"
            onClick={() => (document.getElementById('file-input') as HTMLInputElement)?.click()}
          >
            <p className="text-neutral-400 text-[14px]">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop files here or click to choose'}</p>
            {files.length > 0 && <p className="text-[12px] text-neutral-500 mt-2">{files.map(f => f.name).join(', ')}</p>}
            <input id="file-input" type="file" multiple className="hidden" onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              setFiles(prev => [...prev, ...selected].slice(0, 8));
              const large = selected.some(f => f.size > 40 * 1024 * 1024);
              setWarn(large ? 'Some files are large. Uploads may feel slow. No hard limits.' : null);
            }} />
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A quiet note that drifts with the light…"
            rows={3}
            maxLength={280}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent for the drifting orbs and cards</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={save}
            disabled={busy || (!text.trim() && files.length === 0)}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Drifting…' : 'Release the light'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-2">
                {links.map((l, i) => (
                  <a key={i} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12 space-y-3">
          {notes.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 90, damping: 16 }}
              className="glass rounded-[22px] p-5"
            >
              <p className="text-[15px] text-neutral-100 leading-relaxed">{n.body}</p>
              <p className="text-[11px] text-neutral-500 mt-2">{new Date(n.created_at).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
