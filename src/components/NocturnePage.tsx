import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { supabaseConfig } from '../lib/supabase';

const KEY = 'rankvault-nocturne';

type Recent = { id: string; name: string; caption: string | null; created_at: string };

export default function NocturnePage() {
  const [text, setText] = useState('');
  const [dim, setDim] = useState(0.55);
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#BF5AF2');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.text === 'string') setText(p.text);
        if (typeof p.dim === 'number') setDim(p.dim);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ text, dim }));
    } catch {}
  }, [text, dim]);

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
    setFiles(arr);
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(
      big
        ? 'one or more large files. the browser may feel slow while sending. no hard limit — only a gentle warning.'
        : '',
    );
  };

  const publish = async () => {
    if (!files.length && !text.trim()) {
      setErr('write a line or drop at least one file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      if (files.length) {
        for (const file of files) {
          const res = await publishLocalFile(file, {
            caption: text.trim() || 'nocturne drop',
            cardTitle: file.name,
            color: accent,
            meta: { desk: 'nocturne', accent, note: text.trim() || null },
          });
          if (!res.ok || !res.id) {
            setErr(res.error || 'publish failed for ' + file.name);
            return;
          }
          if (res.warn) setWarn(res.warn);
          const urls = shareUrls(res.id);
          newLinks.push(urls.app);
        }
      }
      setLinks(newLinks);
      if (newLinks.length) {
        try {
          await navigator.clipboard.writeText(newLinks.join('\n'));
        } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
          style={{ opacity: 0.45 + dim * 0.55 }}
        >
          <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-white/30 rounded-full blur-sm animate-pulse" />
          <div className="absolute bottom-16 left-16 w-1 h-1 bg-white/20 rounded-full blur-sm animate-pulse delay-200" />
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>nocturne</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write after the lights go down.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            Local note stays on this device. Optionally drop files that land in the database with your note as caption and polished Discord embeds. Dim the page if the room is already dark. Large files warned, never refused. Prior local writing remains.
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="a line for later… or a caption for the files"
            className="w-full min-h-[180px] rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white outline-none resize-y mb-4"
          />

          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/30 p-6 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {files.length
                ? `${files.length} file${files.length > 1 ? 's' : ''} ready to share`
                : 'optional: drop or click for files to upload'}
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
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={busy || (!files.length && !text.trim())}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition mb-5"
            style={{ background: accent }}
          >
            {busy ? 'gathering…' : files.length ? 'publish files with note' : 'save note locally'}
          </motion.button>

          {links.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-neutral-400 space-y-1"
            >
              <p>copied share links:</p>
              {links.map((l, i) => (
                <p key={i} className="break-all">
                  {l}
                </p>
              ))}
            </motion.div>
          )}

          <div className="flex items-center justify-between text-xs text-neutral-500 mt-4">
            <span>{text.length} letters</span>
            <label className="flex items-center gap-3">
              glow
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.01}
                value={dim}
                onChange={(e) => setDim(Number(e.target.value))}
                className="accent-[#0a84ff]"
              />
            </label>
          </div>
        </motion.div>

        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10"
          >
            <h2 className="text-sm text-neutral-400 mb-4 tracking-wide">recent public drops</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recent.map((r) => (
                <a
                  key={r.id}
                  href={`/s/${r.id}`}
                  className="glass rounded-2xl p-4 block hover:scale-[1.02] transition-transform"
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
