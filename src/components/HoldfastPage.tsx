import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HoldfastPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [keeper, setKeeper] = useState('');
  const [status, setStatus] = useState('a local file is pinned into the share table. no size cap.');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const tone = useMemo(() => (warn ? 'text-amber-200/90' : 'text-white/45'), [warn]);

  useEffect(() => {
    if (!shareId) return;
    setLink(`${location.origin}/holdfast/${shareId}`);
    setStatus('this pin is already in the share table. paste the link in Discord for the card.');
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setLink('');
    if (!next) {
      setWarn('');
      return;
    }
    if (next.size > 12 * 1024 * 1024) {
      setWarn('this pin is heavy. the upload can feel slow, especially on a phone. it is still accepted.');
    } else setWarn('');
  }

  async function pin() {
    if (!file || busy) return;
    setBusy(true);
    setStatus('writing the row…');
    try {
      const result = await publishLocalFile(file, {
        caption: note.trim() || 'holdfast pin',
        author: keeper.trim() || 'holdfast',
        cardTitle: file.name,
        color: 'holdfast',
      });
      if (!result.ok || !result.id) {
        setStatus(result.error || 'the share table did not take the file.');
        return;
      }
      const card = `${location.origin}/holdfast/${result.id}`;
      setLink(card);
      setStatus(result.warn || 'pinned. paste the link in Discord for the card.');
      navigate('holdfast', result.id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'pin failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">file desk</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">holdfast</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Pin one local file with a keeper note. The bytes go into the share table, not a vault drawer. Large drops are warned, never refused.
          </p>
        </motion.div>

        <motion.label
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 block cursor-pointer rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.06]"
        >
          <input
            type="file"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0] || null)}
          />
          <span className="text-sm text-white/80">{file ? file.name : 'choose a local file'}</span>
          <span className="mt-1 block text-[13px] text-white/40">{file ? pretty(file.size) : 'anything you can pick in this tab'}</span>
        </motion.label>

        <div className="mt-4 space-y-3">
          <input
            value={keeper}
            onChange={(e) => setKeeper(e.target.value)}
            placeholder="keeper name"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/25"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="what this pin is for"
            rows={3}
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/25"
          />
        </div>

        <p className={`mt-4 text-[13px] leading-relaxed ${tone}`}>{warn || status}</p>

        <button
          type="button"
          onClick={pin}
          disabled={!file || busy}
          className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40"
        >
          {busy ? 'pinning…' : 'pin file'}
        </button>

        {link && (
          <motion.a
            href={link}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 block break-all rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-sky-200"
          >
            {link}
          </motion.a>
        )}
      </main>
    </div>
  );
}
