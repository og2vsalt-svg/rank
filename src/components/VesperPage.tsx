import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { supabaseConfig } from '../lib/supabase';

type Recent = { id: string; name: string; caption: string | null; created_at: string };

type FileWithCaption = { file: File; caption: string };

export default function VesperPage() {
  const [items, setItems] = useState<FileWithCaption[]>([]);
  const [dedication, setDedication] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${supabaseConfig.url}/rest/v1/public_shares?is_public=eq.true&select=id,name,caption,created_at&order=created_at.desc&limit=6`,
          {
            headers: {
              apikey: supabaseConfig.anonKey,
              Authorization: `Bearer ${supabaseConfig.anonKey}`,
            },
          },
        );
        if (res.ok) {
          const rows = await res.json();
          setRecent(Array.isArray(rows) ? rows : []);
        }
      } catch {}
    })();
  }, []);

  const onFiles = (list: FileList | null) => {
    const arr = list ? Array.from(list) : [];
    const newItems = arr.map((file) => ({ file, caption: '' }));
    setItems((prev) => [...prev, ...newItems]);
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(
      big
        ? 'one or more large files. the browser may feel slow while sending. no hard limit — only a gentle warning.'
        : '',
    );
  };

  const updateCaption = (index: number, caption: string) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, caption } : it)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const publish = async () => {
    if (!items.length) {
      setErr('drop at least one file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const item of items) {
        const caption = item.caption.trim() || dedication.trim() || 'vesper dusk';
        const res = await publishLocalFile(item.file, {
          caption,
          cardTitle: item.file.name,
          color: accent,
          meta: { desk: 'vesper', accent, dedication: dedication.trim() || null, perFileCaption: item.caption.trim() || null },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'publish failed for ' + item.file.name);
          return;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id);
        newLinks.push(urls.app);
      }
      setLinks(newLinks);
      try {
        await navigator.clipboard.writeText(newLinks.join('\n'));
      } catch {}
      setItems([]);
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <motion.div
        className="absolute top-1/3 left-1/6 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-25"
        style={{ background: accent }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/5 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-15"
        style={{ background: '#5E5CE6' }}
        animate={{ scale: [1, 1.25, 1], x: [0, 15, 0], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
          className="glass rounded-[36px] p-8 relative overflow-hidden"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>
            vesper
          </p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">dusk that gathers files into quiet evening light.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop local files into the evening. Add a per-file caption or a shared dedication. Each lands in the database with polished Discord embeds. Large files warned, never refused. Prior desks stay intact. Sleek Apple-style spring animations.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          <textarea
            value={dedication}
            onChange={(e) => setDedication(e.target.value)}
            placeholder="optional shared dedication that travels with every file"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none transition resize-none"
          />

          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/30 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {items.length
                ? `${items.length} file${items.length > 1 ? 's' : ''} ready — add captions below`
                : 'drop or click for one or more files'}
            </p>
          </label>

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 space-y-3"
              >
                {items.map((it, i) => (
                  <div key={i} className="flex gap-2 items-start bg-white/5 rounded-2xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-300 truncate mb-1">
                        {it.file.name} · {(it.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <input
                        value={it.caption}
                        onChange={(e) => updateCaption(i, e.target.value)}
                        placeholder="optional caption for this file"
                        className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-xs placeholder:text-neutral-600 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => removeItem(i)}
                      className="text-neutral-500 hover:text-red-400 text-xs mt-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full py-3 rounded-full text-black text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'gathering dusk…' : 'publish vesper'}
          </motion.button>

          {links.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 text-xs text-neutral-400 space-y-1"
            >
              <p>copied share links:</p>
              {links.map((l, i) => (
                <p key={i} className="break-all">
                  {l}
                </p>
              ))}
            </motion.div>
          )}
        </motion.div>

        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10"
          >
            <h2 className="text-sm text-neutral-400 mb-4 tracking-wide">recent public vespers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recent.map((r) => (
                <a
                  key={r.id}
                  href={`/s/${r.id}`}
                  className="glass rounded-2xl p-4 block hover:scale-[1.03] transition-transform"
                >
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {r.caption && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{r.caption}</p>
                  )}
                  <p className="text-[10px] text-neutral-600 mt-2">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
