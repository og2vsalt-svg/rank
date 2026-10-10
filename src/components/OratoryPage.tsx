import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Dedication = { id: string; body: string; author: string | null; created_at: string };

export default function OratoryPage() {
  const { navigate } = useRouter();
  const [items, setItems] = useState<Dedication[]>([]);
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/whispers?select=*&order=created_at.desc&limit=24`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!body.trim()) return;
    setBusy(true);
    await fetch(`${SB_URL}/rest/v1/whispers`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ body: body.trim(), author: author || null, kind: 'status' }),
    });
    setBody('');
    setAuthor('');
    await load();
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <div className="pt-28 pb-20 px-5 sm:px-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-3">oratory</p>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-3">a quiet word, left open.</h1>
          <p className="text-neutral-400 leading-relaxed mb-8">Short notes beside the files. No boosts, no limits. Just words people chose to leave. The vault and studio stay exactly as they were.</p>
        </motion.div>

        <div className="space-y-3 mb-8">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="leave a short dedication…"
            rows={3}
            maxLength={280}
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="name, optional"
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <button
            onClick={post}
            disabled={!body.trim() || busy}
            className="w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] active:scale-[0.98] transition disabled:opacity-50"
          >
            {busy ? 'leaving…' : 'leave the word'}
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="text-[15px] leading-relaxed">{item.body}</p>
              <p className="mt-2 text-[12px] text-neutral-500">{item.author || 'anonymous'} · {new Date(item.created_at).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>

        <button onClick={() => navigate('studio')} className="mt-10 text-sm text-[#0A84FF] hover:underline">
          or return to the studio →
        </button>
      </div>
    </div>
  );
}
