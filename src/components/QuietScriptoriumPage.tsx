import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function QuietScriptoriumPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState('#AF52DE');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string } | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(6).then(setRecent).catch(() => {});
  }, []);

  const onFile = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (!arr.length) return;
    const f = arr[0];
    const large = f.size > 40 * 1024 * 1024;
    setWarn(large ? 'large attachment. the browser may feel slow while uploading. no hard limit.' : null);
    setFile(f);
    setStatus('idle');
  }, []);

  const publish = async () => {
    if (!title.trim() && !body.trim() && !file) return;
    setStatus('uploading');
    let toPublish: File;
    if (file) {
      toPublish = file;
    } else {
      const text = `${title}\n\n${body}`.trim();
      toPublish = new File([text], `${title || 'note'}.txt`, { type: 'text/plain' });
    }
    const caption = body.slice(0, 280) || title;
    const res = await publishLocalFile(toPublish, {
      caption,
      color,
      cardTitle: title || toPublish.name.replace(/\.[^.]+$/, ''),
      author: 'rankvault',
      meta: { desk: 'quietscriptorium', isNote: !file },
    });
    if (res.ok && res.id) {
      setResult({ id: res.id, embed: shareUrls(res.id).embed });
      setTitle('');
      setBody('');
      setFile(null);
      listPublicShares(6).then(setRecent).catch(() => {});
    }
    setStatus('done');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="min-h-screen bg-transparent text-white pt-24 px-5 pb-16 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4 }}
        >
          <div className="absolute left-1/3 top-1/4 w-[480px] h-[480px] rounded-full blur-3xl" style={{ background: `${color}14` }} />
        </motion.div>

        <div className="max-w-4xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 85, damping: 20 }}
            className="text-4xl font-semibold tracking-tight mb-2"
          >
            quiet scriptorium
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 mb-8 max-w-2xl"
          >
            A still desk for writing. Compose a note or attach a local file. They settle into the shared database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style spring motion on frosted glass. All prior desks remain fully intact.
          </motion.p>

          <div className="grid md:grid-cols-[1fr_280px] gap-8">
            <div className="space-y-5">
              <input
                type="text"
                placeholder="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-lg outline-none focus:border-white/30 font-medium"
              />
              <textarea
                placeholder="write something quiet…"
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full min-h-[280px] bg-white/5 border border-white/10 rounded-3xl px-5 py-4 text-sm outline-none focus:border-white/30 resize-none leading-relaxed"
              />
              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files); }}
                className="block rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center cursor-pointer hover:border-white/30 transition text-sm"
              >
                <input type="file" className="hidden" onChange={e => e.target.files && onFile(e.target.files)} />
                {file ? file.name : 'optional local file attachment'}
                {warn && <div className="mt-1 text-amber-300 text-xs">{warn}</div>}
              </label>
              <div className="flex gap-4 items-center">
                <label className="text-sm text-neutral-400">accent</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-8 rounded-lg bg-transparent border-0" />
              </div>
              <button
                onClick={publish}
                disabled={status === 'uploading' || (!title.trim() && !body.trim() && !file)}
                className="w-full rounded-2xl bg-white text-black font-medium py-3 disabled:opacity-40 transition hover:scale-[1.015] active:scale-[0.985]"
              >
                {status === 'uploading' ? 'settling the page…' : 'publish from the scriptorium'}
              </button>

              <AnimatePresence>
                {result && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 rounded-2xl p-4">
                    <div className="font-medium mb-1">shared</div>
                    <a href={result.embed} className="text-sm text-blue-400 truncate block" target="_blank" rel="noreferrer">{result.embed}</a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <h2 className="text-sm font-medium text-neutral-400 mb-3">recent pages</h2>
              <div className="space-y-3">
                {recent.map(item => (
                  <motion.a
                    key={item.id}
                    href={`/s/${item.id}`}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="block bg-white/5 hover:bg-white/10 rounded-2xl p-3 transition text-sm"
                  >
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{item.caption || 'shared quietly'}</div>
                  </motion.a>
                ))}
                {recent.length === 0 && <div className="text-neutral-500 text-xs">nothing yet</div>}
              </div>
              <button onClick={() => navigate('notes')} className="mt-6 text-xs text-neutral-400 hover:text-white">local notes desk →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
