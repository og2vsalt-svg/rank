import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, publishShare, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type ThreadEntry = {
  id: string;
  body: string;
  file?: File;
  thumb?: string;
  published?: { id: string; url: string; warn?: string };
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function LumenThreadPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [entries, setEntries] = useState<ThreadEntry[]>([{ id: uid(), body: '' }]);
  const [publishing, setPublishing] = useState(false);
  const [masterUrl, setMasterUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const addEntry = () => {
    setEntries((e) => [...e, { id: uid(), body: '' }]);
  };

  const updateBody = (id: string, body: string) => {
    setEntries((e) => e.map((x) => (x.id === id ? { ...x, body } : x)));
  };

  const attachFile = (id: string, file: File | null) => {
    setEntries((e) =>
      e.map((x) => {
        if (x.id !== id) return x;
        if (x.thumb) URL.revokeObjectURL(x.thumb);
        let thumb: string | undefined;
        if (file && file.type.startsWith('image/')) {
          try {
            thumb = URL.createObjectURL(file);
          } catch {}
        }
        return { ...x, file: file || undefined, thumb };
      }),
    );
  };

  const removeEntry = (id: string) => {
    setEntries((e) => {
      if (e.length <= 1) return e;
      const target = e.find((x) => x.id === id);
      if (target?.thumb) URL.revokeObjectURL(target.thumb);
      return e.filter((x) => x.id !== id);
    });
  };

  const prettySize = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  const publish = async () => {
    const hasContent = title.trim() || entries.some((e) => e.body.trim() || e.file);
    if (!hasContent) {
      setError('add a title or at least one thought / file');
      return;
    }
    setPublishing(true);
    setError(null);
    setMasterUrl(null);

    try {
      const done: ThreadEntry[] = [];
      for (const entry of entries) {
        if (entry.file) {
          const pub = await publishLocalFile(entry.file, {
            caption: entry.body.trim() || title.trim() || 'From Lumen Thread',
            cardTitle: entry.file.name,
            color: accent,
            meta: { thread: true, threadTitle: title.trim() || null },
          });
          if (pub.ok && pub.id) {
            const urls = shareUrls(pub.id);
            done.push({
              ...entry,
              published: { id: pub.id, url: urls.embed, warn: pub.warn || undefined },
            });
          } else {
            setError(pub.error || 'one attachment could not be vaulted');
            setPublishing(false);
            return;
          }
        } else {
          done.push(entry);
        }
      }

      const lines: string[] = [];
      lines.push(`# ${title.trim() || 'Lumen Thread'}`);
      lines.push('', '---', '');

      done.forEach((entry, i) => {
        lines.push(`### ${i + 1}`);
        if (entry.body.trim()) lines.push(entry.body.trim(), '');
        if (entry.published) {
          const name = entry.file?.name || 'attachment';
          const size = entry.file ? prettySize(entry.file.size) : '';
          lines.push(`**[${name}](${entry.published.url})**${size ? ` · ${size}` : ''}`);
          if (entry.published.warn) lines.push(`> ${entry.published.warn}`);
          lines.push('');
        }
        lines.push('');
      });

      lines.push('---', '', '_threaded on rankvault · every file link carries a polished Discord embed_');
      const markdown = lines.join('\n');
      const dataUrl =
        'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
      const masterId = uid();
      const master = await publishShare({
        id: masterId,
        name: (title.trim() || 'lumen-thread') + '.md',
        type: 'text/markdown',
        size: markdown.length,
        dataUrl,
        caption: title.trim() || 'A quiet thread of thoughts and files',
        author: 'lumenthread',
      });

      if (master.ok && master.id) {
        setEntries(done);
        setMasterUrl(shareUrls(master.id).embed);
      } else {
        setError(master.error || 'could not publish the thread');
      }
    } catch (e: any) {
      setError(e?.message || 'something quiet went wrong');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen thread</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">
            one thought
            <br />
            after another.
          </h1>
          <p className="text-neutral-400 text-lg max-w-lg mx-auto leading-relaxed">
            Build a quiet sequence. Each entry can hold words and an optional local file. Publish
            the whole thread as one permanent Discord-ready markdown share; every file also gets
            its own polished embed link. Soft size warnings only — no hard limits, no boosting.
            Apple-style springs on frosted glass. Prior desks remain untouched.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20, delay: 0.05 }}
          className="space-y-5 mb-8"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="thread title"
            className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-base outline-none focus:border-[#0A84FF]/50 transition"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent"
            />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>
        </motion.div>

        <div className="space-y-4 mb-8">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.03,
                type: 'spring',
                stiffness: 150,
                damping: 20,
              }}
              className="glass rounded-2xl p-5"
              style={{ borderLeft: `3px solid ${accent}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-neutral-500">entry {index + 1}</span>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="text-xs text-neutral-500 hover:text-red-400"
                  >
                    remove
                  </button>
                )}
              </div>
              <textarea
                value={entry.body}
                onChange={(e) => updateBody(entry.id, e.target.value)}
                placeholder="what happens next…"
                rows={3}
                className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-neutral-600 mb-3"
              />
              <div className="flex items-center gap-3">
                <input
                  ref={(el) => {
                    fileRefs.current[entry.id] = el;
                  }}
                  type="file"
                  className="hidden"
                  onChange={(e) => attachFile(entry.id, e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileRefs.current[entry.id]?.click()}
                  className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition"
                >
                  {entry.file ? 'change file' : 'attach local file'}
                </button>
                {entry.file && (
                  <div className="flex items-center gap-2 min-w-0">
                    {entry.thumb && (
                      <img
                        src={entry.thumb}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    )}
                    <span className="text-xs text-neutral-400 truncate">{entry.file.name}</span>
                    <span className="text-xs text-neutral-600">
                      {prettySize(entry.file.size)}
                      {entry.file.size > 40 * 1024 * 1024 ? ' · may feel slow' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => attachFile(entry.id, null)}
                      className="text-xs text-neutral-500 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              {entry.published && (
                <p className="text-xs text-[#0A84FF] mt-2 truncate">{entry.published.url}</p>
              )}
            </motion.div>
          ))}
        </div>

        <button
          type="button"
          onClick={addEntry}
          className="mb-8 px-4 py-2 rounded-full bg-white/5 text-sm text-neutral-300 hover:bg-white/10 transition"
        >
          + add entry
        </button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={publish}
          disabled={publishing}
          className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50 mb-6"
        >
          {publishing ? 'threading…' : 'publish thread'}
        </motion.button>

        {error && <p className="text-sm text-red-400 text-center mb-6">{error}</p>}

        <AnimatePresence>
          {masterUrl && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="text-center space-y-4 glass rounded-3xl p-8"
            >
              <p className="text-sm text-neutral-400">thread is live</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                the master document holds the whole sequence. every attached file also has its own
                permanent Discord-ready link.
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(masterUrl)}
                className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium"
              >
                copy master link
              </button>
              <div className="pt-3 space-y-1">
                {entries
                  .filter((e) => e.published)
                  .map((e) => (
                    <button
                      key={e.published!.id}
                      onClick={() => navigator.clipboard.writeText(e.published!.url)}
                      className="block w-full text-left text-xs text-neutral-400 hover:text-white truncate px-3 py-1.5 rounded-lg hover:bg-white/5"
                    >
                      {e.file?.name} → copy
                    </button>
                  ))}
              </div>
              <button
                onClick={() => navigate('home')}
                className="block mx-auto text-sm text-neutral-500 hover:text-white mt-4"
              >
                ← back home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
