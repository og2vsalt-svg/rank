import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function QuietNotesBoardPage() {
  const { navigate } = useRouter();
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [posting, setPosting] = useState(false);
  const [notes, setNotes] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastEmbed, setLastEmbed] = useState('');

  const load = async () => {
    const list = await listPublicShares(36);
    const texty = list.filter((s) => s.type === 'text/plain' || (s.caption && s.size < 8000));
    setNotes(texty.slice(0, 24));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const post = async () => {
    if (!body.trim()) return;
    setPosting(true);
    const blob = new Blob([body.trim()], { type: 'text/plain' });
    const file = new File([blob], (title || 'note').replace(/[^a-z0-9._-]/gi, '_') + '.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, {
      caption: body.trim(),
      cardTitle: title || 'quiet note',
      author: author || undefined,
    });
    if (res.ok && res.id) {
      setLastEmbed(shareUrls(res.id).embed);
      setBody('');
      setTitle('');
      await load();
    }
    setPosting(false);
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <div className="pt-28 pb-20 px-5 sm:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <p className="text-[#64D2FF] text-sm font-medium tracking-wide mb-3">quiet notes board</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] mb-4">
            leave a note in the quiet.
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mb-10 leading-relaxed">
            A different kind of desk — short public notes instead of file vaults. Each note lands as a small text share in the database with a polished Discord card. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 mb-10"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="optional title"
            className="w-full bg-transparent border-b border-white/10 pb-2 mb-4 text-lg font-medium focus:outline-none focus:border-[#64D2FF]/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="write a quiet note…"
            rows={5}
            className="w-full bg-transparent text-sm leading-relaxed focus:outline-none resize-none placeholder:text-neutral-600"
          />
          <div className="flex items-center gap-3 mt-4">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="optional name"
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={post}
              disabled={!body.trim() || posting}
              className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50"
            >
              {posting ? 'leaving…' : 'leave note'}
            </motion.button>
          </div>
          {lastEmbed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex gap-2 items-center">
              <input readOnly value={lastEmbed} className="flex-1 bg-black/40 rounded-xl px-3 py-1.5 text-xs font-mono" />
              <button onClick={() => copy(lastEmbed)} className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-medium">copy</button>
            </motion.div>
          )}
        </motion.div>

        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-4">recent notes</p>
          {loading ? (
            <p className="text-neutral-500 text-sm">gathering…</p>
          ) : notes.length === 0 ? (
            <p className="text-neutral-500">no notes yet. leave the first one.</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {notes.map((n, i) => (
                  <motion.button
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 200, damping: 22 }}
                    onClick={() => navigate('s', n.id)}
                    className="w-full text-left rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:bg-white/[0.07] transition"
                  >
                    <p className="font-medium text-sm mb-1">{n.name || 'untitled note'}</p>
                    <p className="text-sm text-neutral-300 line-clamp-3">{n.caption || ''}</p>
                    <p className="text-[10px] text-neutral-500 mt-2">{n.author || 'anonymous'} · {(n.size / 1024).toFixed(1)} KB</p>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
