import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Echo = { id: string; body: string; author?: string | null; accent?: string; created_at: string };

export default function SoftEchoPage() {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [sending, setSending] = useState(false);

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/soft_echoes?select=*&order=created_at.desc&limit=40`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (res.ok) setEchoes(await res.json());
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await fetch(`${SB_URL}/rest/v1/soft_echoes`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ id, body: body.trim(), author: author.trim() || null, accent }),
    });
    setBody('');
    setSending(false);
    load();
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white pt-24 px-5 pb-20">
      <div className="max-w-xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          soft echo
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }} className="text-neutral-400 mb-8">
          Leave a quiet line. It settles into the public stream with soft spring motion. No accounts required. All prior features stay.
        </motion.p>

        <div className="glass rounded-3xl p-6 mb-8">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="a soft line…"
            rows={3}
            className="w-full bg-transparent outline-none resize-none text-sm"
          />
          <div className="flex items-center gap-3 mt-3">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="optional name"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-8 h-8 rounded-full border-0" />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={send}
              disabled={sending || !body.trim()}
              className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              {sending ? '…' : 'echo'}
            </motion.button>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {echoes.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 apple-card"
                style={{ borderLeft: `3px solid ${e.accent || '#0A84FF'}` }}
              >
                <p className="text-sm leading-relaxed">{e.body}</p>
                <p className="text-xs text-neutral-500 mt-2">{e.author || 'anonymous'} · {new Date(e.created_at).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
