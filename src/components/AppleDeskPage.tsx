import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Note = { id: string; body: string; created_at: string };

export default function AppleDeskPage() {
  const [text, setText] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [notes, setNotes] = useState<Note[]>([]);
  const [attached, setAttached] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [link, setLink] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/whispers?select=id,body,created_at&order=created_at.desc&limit=16`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      });
      if (r.ok) setNotes(await r.json());
    } catch {}
  };

  useEffect(() => { refresh(); }, []);

  const save = async () => {
    if (!text.trim() && !attached) return setErr('add a note or a file');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      if (attached) {
        const res = await publishLocalFile(attached, {
          caption: text.trim() || 'from the apple desk',
          color: accent,
          cardTitle: attached.name,
          meta: { desk: 'appledesk' },
        });
        if (res.ok && res.embed) setLink(res.embed);
        else if (!res.ok) setErr(res.error || 'upload failed');
        setAttached(null);
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
          body: JSON.stringify({ body: text.trim().slice(0, 280), kind: 'status' }),
        });
        setText('');
      }
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="glass rounded-[28px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Apple Desk</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Notes and files, quietly.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            A still desk. Write a short note or drop a local file. Notes settle into the whispers table. Files upload to storage and public_shares. Every share link carries a professional Discord embed. Soft spring animations, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain. No traces of boosting.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a quiet note…"
            rows={4}
            maxLength={280}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <label className="text-[13px] text-neutral-300 cursor-pointer hover:text-white transition">
              {attached ? attached.name : 'Attach local file'}
              <input type="file" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setAttached(f);
                setWarn(f && f.size > 40 * 1024 * 1024 ? 'This file is large. The upload may feel slow. No hard limit.' : null);
              }} />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={save}
            disabled={busy || (!text.trim() && !attached)}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : 'Save to desk'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.a
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                href={link}
                className="block mt-5 text-[13px] break-all"
                style={{ color: accent }}
              >
                {link}
              </motion.a>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12 space-y-3">
          {notes.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 18 }}
              className="glass rounded-[20px] p-5"
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
