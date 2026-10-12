import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { supabaseConfig } from '../lib/supabase';

type Recent = { id: string; name: string; caption: string | null; created_at: string };

export default function GlimmerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dedication, setDedication] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${supabaseConfig.url}/rest/v1/public_shares?is_public=eq.true&select=id,name,caption,created_at&order=created_at.desc&limit=8`,
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
    setFiles(arr);
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(
      big
        ? 'one or more large files. the browser may feel slow while sending. no hard limit — only a gentle warning.'
        : '',
    );
  };

  const publish = async () => {
    if (!files.length) {
      setErr('drop at least one file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: dedication.trim() || 'glimmer drop',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'glimmer', accent, dedication: dedication.trim() || null },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'publish failed for ' + file.name);
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
        className="absolute top-1/4 left-1/6 w-96 h-96 rounded-full blur-[100px] pointer-events-none"
        style={{ background: accent, opacity: 0.18 }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/5 right-1/5 w-72 h-72 rounded-full blur-[80px] pointer-events-none"
        style={{ background: '#5E5CE6', opacity: 0.1 }}
        animate={{ scale: [1, 1.12, 1], y: [0, -15, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[40px] p-8 md:p-10 relative overflow-hidden"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>
            glimmer
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mb-3 tracking-tight">soft light that stays with the file.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop one or more local files into the glimmer. Each is stored in the database with your dedication and accent color. Share links open with polished Discord embeds. Large files are gently warned — never refused. Older desks remain untouched.
          </p>

          <div className="flex items-center gap-3 mb-5">
            <label className="text-xs text-neutral-400">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-11 h-11 rounded-2xl border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          <textarea
            value={dedication}
            onChange={(e) => setDedication(e.target.value)}
            placeholder="optional dedication that travels with every file"
            rows={3}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none transition resize-none"
          />

          <label
            className="block cursor-pointer rounded-3xl border border-dashed border-white/15 hover:border-white/30 p-10 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {files.length
                ? `${files.length} file${files.length > 1 ? 's' : ''} ready to glimmer`
                : 'drop or click for one or more files'}
            </p>
          </label>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 space-y-1 text-xs text-neutral-400"
              >
                {files.map((f, i) => (
                  <li key={i} className="truncate">
                    {f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.965 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full py-3.5 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'catching light…' : 'publish glimmer'}
          </motion.button>

          {links.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-xs text-neutral-400 space-y-1"
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
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 80, damping: 20 }}
            className="mt-12"
          >
            <h2 className="text-sm text-neutral-400 mb-4 tracking-wide">recent public glimmers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recent.map((r) => (
                <motion.a
                  key={r.id}
                  href={`/s/${r.id}`}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="glass rounded-2xl p-4 block"
                >
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {r.caption && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{r.caption}</p>
                  )}
                  <p className="text-[10px] text-neutral-600 mt-2">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
