import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function QuietSnippetPage() {
  const [code, setCode] = useState('// paste or type a quiet snippet\nfunction greet(name) {\n  return `hello, ${name}`;\n}\n');
  const [title, setTitle] = useState('untitled snippet');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#AF52DE');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string } | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(10).then(setRecent).catch(() => {});
  }, []);

  const publish = async () => {
    if (!code.trim()) return;
    setStatus('uploading');
    const blob = new Blob([code], { type: 'text/plain' });
    const file = new File([blob], `${title.replace(/[^a-z0-9._-]/gi, '_') || 'snippet'}.txt`, { type: 'text/plain' });
    if (file.size > 40 * 1024 * 1024) setWarn('unusually large snippet. may feel slow. no hard limit.');
    else setWarn(null);
    const res = await publishLocalFile(file, {
      caption: caption || undefined,
      color,
      cardTitle: title,
      author: 'rankvault',
      meta: { desk: 'quietsnippet' },
    });
    if (res.ok && res.id) {
      setResult({ id: res.id, embed: shareUrls(res.id).embed });
      setStatus('done');
      listPublicShares(10).then(setRecent).catch(() => {});
    } else {
      setStatus('idle');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="min-h-screen bg-transparent text-white pt-24 px-5 pb-16">
        <div className="max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="text-4xl font-semibold tracking-tight mb-2"
          >
            quiet snippet
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 mb-8 max-w-2xl"
          >
            Compose a quiet code or text snippet. Live monospaced preview on dark glass. Publish straight to storage and the public record. Professional Discord embed on the link. Soft size warnings only.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="snippet title"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/30"
              />
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                rows={16}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-sm outline-none focus:border-white/30 resize-y"
                spellCheck={false}
              />
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="optional caption"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/30"
              />
              <div className="flex items-center gap-4">
                <label className="text-sm text-neutral-400">accent</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent" />
              </div>
              {warn && <div className="text-amber-300 text-sm">{warn}</div>}
              <button
                onClick={publish}
                disabled={!code.trim() || status === 'uploading'}
                className="w-full rounded-2xl bg-white text-black font-medium py-3 disabled:opacity-40 transition hover:scale-[1.01] active:scale-[0.99]"
              >
                {status === 'uploading' ? 'publishing…' : 'publish snippet'}
              </button>
              {result && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 rounded-2xl p-4">
                  <a href={result.embed} className="text-blue-400 text-sm" target="_blank" rel="noreferrer">{result.embed}</a>
                </motion.div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4">live preview</h2>
              <div className="bg-black/60 rounded-3xl p-6 border border-white/10 min-h-[300px]">
                <div className="text-xs text-neutral-500 mb-3 tracking-wider uppercase">{title || 'untitled'}</div>
                <pre className="font-mono text-sm text-neutral-200 whitespace-pre-wrap break-all">{code || ' '}</pre>
              </div>
              <h2 className="text-lg font-medium mt-8 mb-4">recent snippets</h2>
              <div className="space-y-3">
                {recent.filter(r => (r.type || '').includes('text') || r.name?.endsWith('.txt')).slice(0, 6).map(item => (
                  <a key={item.id} href={`/s/${item.id}`} className="block bg-white/5 hover:bg-white/10 rounded-2xl p-3 text-sm truncate transition">
                    {item.name || item.cardTitle || 'snippet'}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
