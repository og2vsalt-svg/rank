import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SLOW = 8 * 1024 * 1024;

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

type Share = {
  id: string;
  title?: string;
  caption: string | null;
  name: string;
  mime: string | null;
  size: number;
  file_url?: string;
  accent?: string | null;
  created_at: string;
  warn?: string | null;
  meta?: { title?: string; accent?: string };
};

export default function StillwaterPage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [focus, setFocus] = useState<Share | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/stillwater');
    const data = await res.json();
    setShares(Array.isArray(data.shares) ? data.shares : []);
  }

  useEffect(() => {
    load().catch(() => setError('stillwater is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/stillwater?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function leave(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('choose a local file');
      return;
    }
    setBusy(true);
    setError('');
    setWarn('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/stillwater', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, name: file.name, type: file.type, size: file.size, title, caption, accent }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'stillwater did not take it');
      if (data.warn) setWarn(data.warn);
      const path = data.sharePath || `/stillwater/${data.id}`;
      setLink(window.location.origin + path);
      navigate('stillwater', data.id);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'stillwater did not take it');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5f5f7] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'radial-gradient(800px 400px at 50% 0%, rgba(90,200,250,0.12), transparent 60%)' }} />
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-32 relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="mb-10"
        >
          <p className="text-[#5AC8FA] text-sm font-medium tracking-wide mb-2">still water</p>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">a quiet surface for one file</h1>
          <p className="mt-3 text-neutral-400 text-lg leading-relaxed">
            Drop a local file with an optional title and note. It settles into storage and the public table with a soft spring, like a stone into still water. Share links open with a clean Discord card. Large files receive only a gentle warning of slowness.
          </p>
        </motion.div>

        <motion.form
          onSubmit={leave}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 19, delay: 0.06 }}
          className="rounded-3xl bg-white/[0.025] border border-white/[0.07] backdrop-blur-2xl p-6 mb-10 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
        >
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="relative rounded-2xl border border-dashed border-white/12 bg-white/[0.015] min-h-[150px] grid place-items-center text-center px-6 py-10 transition-all duration-200 hover:border-[#5AC8FA]/30 hover:bg-white/[0.03]"
          >
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-neutral-500 mt-1">{prettySize(file.size)}</p>
                {file.size > SLOW && <p className="text-xs text-amber-400/70 mt-2">large — clients may open slowly</p>}
              </div>
            ) : (
              <p className="text-neutral-500">drop a file here, or click</p>
            )}
          </div>

          <div className="grid gap-3 mt-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="title"
              className="bg-white/[0.035] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#5AC8FA]/40 focus:bg-white/[0.05] transition"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="still note"
              rows={2}
              className="bg-white/[0.035] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#5AC8FA]/40 focus:bg-white/[0.05] transition resize-none"
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-neutral-500">accent</label>
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-9 h-8 rounded-md bg-transparent border-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              disabled={busy || !file}
              className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium disabled:opacity-40 transition hover:brightness-105 active:scale-[0.98]"
            >
              {busy ? 'settling…' : 'leave it'}
            </button>
            {link && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(link)}
                className="text-sm text-neutral-400 hover:text-white transition"
              >
                copy link
              </button>
            )}
          </div>
          {error && <p className="text-red-400/90 text-sm mt-3">{error}</p>}
          {warn && <p className="text-amber-300/80 text-sm mt-3">{warn}</p>}
        </motion.form>

        <AnimatePresence>
          {focus && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              className="rounded-3xl bg-white/[0.035] border border-white/10 p-6 mb-10"
            >
              <h2 className="text-xl font-medium">{focus.meta?.title || focus.title || focus.name}</h2>
              {focus.caption && <p className="text-neutral-400 mt-2 leading-relaxed">{focus.caption}</p>}
              <p className="text-sm text-neutral-500 mt-3">{prettySize(focus.size)} · {focus.mime || 'file'}</p>
              {focus.file_url && (
                <a
                  href={focus.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-4 text-sm text-[#5AC8FA] hover:underline"
                >
                  open
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-2.5">
          {shares.map((s) => (
            <motion.button
              key={s.id}
              onClick={() => navigate('stillwater', s.id)}
              whileHover={{ y: -1.5, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              className="text-left rounded-2xl bg-white/[0.025] border border-white/[0.05] px-5 py-3.5 hover:bg-white/[0.04] transition"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium truncate">{s.meta?.title || s.title || s.name}</p>
                <p className="text-xs text-neutral-500 shrink-0">{prettySize(s.size)}</p>
              </div>
              {s.caption && <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">{s.caption}</p>}
            </motion.button>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
