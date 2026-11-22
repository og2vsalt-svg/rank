import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const LANGS = ['plaintext', 'javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', 'shell'];

export default function SnippetPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [lang, setLang] = useState('plaintext');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const onBody = (v: string) => {
    setBody(v);
    setWarn(v.length > 200_000 ? 'Large snippet. The browser may feel slow while it uploads. No hard limits.' : null);
  };

  const publish = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const ext = lang === 'markdown' ? 'md' : lang === 'shell' ? 'sh' : lang === 'plaintext' ? 'txt' : lang;
      const name = (title.trim() || 'snippet') + '.' + ext;
      const file = new File([body], name, { type: 'text/plain' });
      const caption = (title.trim() || 'code snippet') + (lang !== 'plaintext' ? ' · ' + lang : '');
      const res = await publishLocalFile(file, {
        caption,
        color: '#0A84FF',
        cardTitle: name,
        meta: { desk: 'snippet', lang },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'could not share the snippet');
      }
    } catch (e: any) {
      setError(e.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Snippet Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Share a quiet snippet.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Paste code or text. Choose a language. It becomes a shareable file with a polished Discord embed. Soft size warnings only.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional title"
              className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
            />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-white/30"
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <textarea
            value={body}
            onChange={(e) => onBody(e.target.value)}
            placeholder="Paste your snippet…"
            rows={14}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[14.5px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none font-mono leading-relaxed"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !body.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing snippet…' : 'Share snippet'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
              <p className="text-sm text-neutral-400 mb-2">your snippet is live</p>
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#0A84FF] text-sm underline">
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
