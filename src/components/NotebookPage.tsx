import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function NotebookPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const res = await fetch('https://tqfocdktvjuwoiyfgesb.supabase.co/rest/v1/whispers', {
        method: 'POST',
        headers: {
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g',
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id,
          author: title.trim() || 'anonymous',
          body: body.trim(),
          created_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setLink(`${window.location.origin}/reading/${id}`);
      setBody('');
      setTitle('');
    } catch (e: any) {
      setError(e.message || 'could not save note');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#5AC8FA] mb-2">Notebook</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Write a quiet note.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Not a file. Just words. Stored in the database. Every link gets a polished Discord embed. Soft and human.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title or author"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition"
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write something..."
            rows={8}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition resize-none"
          />

          {error && <p className="text-[13px] text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={save}
            disabled={busy || !body.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-black bg-[#5AC8FA] disabled:opacity-40 transition shadow-xl"
          >
            {busy ? 'Saving...' : 'Share note'}
          </motion.button>

          {link && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-4"
            >
              <p className="text-sm text-neutral-300 mb-1">Your note is ready</p>
              <a href={link} target="_blank" rel="noreferrer" className="text-sm text-[#5AC8FA] break-all">{link}</a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
