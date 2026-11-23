import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function StoryDeskPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<string[]>(['']);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const addSection = () => setSections((s) => [...s, '']);
  const updateSection = (i: number, v: string) => setSections((s) => s.map((sec, idx) => idx === i ? v : sec));
  const removeSection = (i: number) => setSections((s) => s.length > 1 ? s.filter((_, idx) => idx !== i) : s);

  const publish = async () => {
    if (busy) return;
    const content = sections.filter(s => s.trim()).join('\n\n---\n\n');
    if (!content.trim()) {
      setError('write at least one section');
      return;
    }
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const full = `# ${title || 'untitled story'}\n\n${content}`;
      const blob = new Blob([full], { type: 'text/markdown' });
      const file = new File([blob], `${(title || 'story').replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.md`, { type: 'text/markdown' });
      setWarn(file.size > 40 * 1024 * 1024 ? 'Large story. Browser may feel slow while sending. No hard limits.' : null);
      const res = await publishLocalFile(file, {
        caption: title || 'quiet story',
        color: '#0A84FF',
        cardTitle: title || 'story.md',
        meta: { desk: 'storydesk', kind: 'narrative', sections: sections.length },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'could not share the story');
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
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Story Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Write a quiet story.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Multiple sections that become a single markdown share. Permanent link with polished Discord embed. Soft size warnings only. Apple-style springs.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Story title (optional)"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          {sections.map((sec, i) => (
            <div key={i} className="mb-4 relative">
              <textarea
                value={sec}
                onChange={(e) => updateSection(i, e.target.value)}
                placeholder={`Section ${i + 1}`} 
                rows={4}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
              />
              {sections.length > 1 && (
                <button
                  onClick={() => removeSection(i)}
                  className="absolute top-3 right-3 text-xs text-neutral-500 hover:text-white"
                >
                  remove
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addSection}
            className="text-sm text-[#0A84FF] mb-6 hover:underline"
          >
            + add section
          </button>

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing story…' : 'Share story'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
              <p className="text-sm text-neutral-400 mb-2">your story is live</p>
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
