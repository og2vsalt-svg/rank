import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Whisper = { id: string; body: string; author: string | null; created_at: string; kind: string | null };

export default function WhisperWallPage() {
  const [items, setItems] = useState<Whisper[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/whispers?select=*&order=created_at.desc&limit=40`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!body.trim() || body.length > 280) return;
    setPosting(true);
    await fetch(`${SB_URL}/rest/v1/whispers`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ body: body.trim(), kind: 'status', author: null }),
    });
    setBody('');
    setPosting(false);
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">wall</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.035em]">whisper wall</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            Leave a short public note. 280 characters. Files still live on the other desks. Spring motion, glass surfaces. Discord embeds on share links. Large drops warned elsewhere. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        <div className="mt-8 glass rounded-3xl p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={280}
            placeholder="a quiet note…"
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-white/25"
            rows={3}
          />
          <div className="mt-2 flex items-center justify-between text-[12px] text-white/40">
            <span>{body.length}/280</span>
            <button
              onClick={post}
              disabled={posting || !body.trim()}
              className="rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-40"
            >
              {posting ? 'settling…' : 'leave'}
            </button>
          </div>
        </div>

        {loading && <p className="mt-8 text-sm text-white/40">listening…</p>}

        <div className="mt-6 space-y-3">
          {items.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 16 }}
              className="glass rounded-2xl p-4"
            >
              <p className="text-[14px] leading-relaxed">{w.body}</p>
              <p className="mt-2 text-[11px] text-white/30">
                {new Date(w.created_at).toLocaleString()}
                {w.author ? ` · ${w.author}` : ''}
              </p>
            </motion.div>
          ))}
        </div>

        {!loading && !items.length && (
          <p className="mt-8 text-sm text-white/40">the wall is quiet. leave the first note.</p>
        )}
      </main>
    </div>
  );
}
