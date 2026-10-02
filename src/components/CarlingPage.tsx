import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Filed = { name: string; id: string; embed: string; warn: string | null };

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function CarlingPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('carling index');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('');
  const [err, setErr] = useState('');
  const [filed, setFiled] = useState<Filed[]>([]);
  const [indexId, setIndexId] = useState('');
  const [copied, setCopied] = useState('');

  const slow = useMemo(() => {
    const bytes = files.reduce((n, f) => n + f.size, 0);
    return bytes > 12 * 1024 * 1024 ? 'a heavy pile. the tab may feel slow while each file lands. nothing is refused.' : null;
  }, [files]);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    setFiled([]);
    setIndexId('');
    const landed: Filed[] = [];
    for (const file of files) {
      setStep(file.name);
      const res = await publishLocalFile(file, {
        cardTitle: file.name,
        caption: note.trim() || 'filed from carling',
        author: 'carling',
        color: '#0A84FF',
      });
      if (!res.ok || !res.id) {
        setErr(res.error || `the share table did not take ${file.name}`);
        setBusy(false);
        setStep('');
        setFiled(landed);
        return;
      }
      landed.push({ name: file.name, id: res.id, embed: shareUrls(res.id).embed, warn: res.warn || null });
      setFiled([...landed]);
    }
    const lines = [
      `# ${title.trim() || 'carling index'}`,
      '',
      note.trim(),
      '',
      ...landed.map((row, i) => `${i + 1}. ${row.name} — ${row.embed}`),
      '',
    ].filter((line, i, arr) => !(line === '' && arr[i - 1] === ''));
    const index = new File([lines.join('\n')], `${(title.trim() || 'carling').replace(/\s+/g, '-').toLowerCase()}.md`, { type: 'text/markdown' });
    setStep('index');
    const indexRes = await publishLocalFile(index, {
      cardTitle: title.trim() || 'carling index',
      caption: `${landed.length} file${landed.length === 1 ? '' : 's'} filed`,
      author: 'carling',
      color: '#0A84FF',
    });
    setBusy(false);
    setStep('');
    if (!indexRes.ok || !indexRes.id) {
      setErr(indexRes.error || 'files landed, but the index card did not');
      return;
    }
    setIndexId(indexRes.id);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(''), 1200);
  };

  const indexUrl = indexId ? shareUrls(indexId).embed : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial="hidden" animate="show" variants={rise}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">file desk</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">carling</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            Several local files land in the share database, one row each. Carling then files a markdown index of the Discord cards. No size cap — only a warning if the browser will feel it.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass mt-8 rounded-3xl p-5 sm:p-6"
        >
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer">
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                setFiles(Array.from(e.target.files || []));
                setIndexId('');
                setFiled([]);
              }}
            />
            <span className="text-sm text-neutral-200">{files.length ? `${files.length} local file${files.length === 1 ? '' : 's'}` : 'choose local files'}</span>
            <span className="block mt-1 text-xs text-white/40">each one becomes its own public row</span>
          </label>
          {slow && <p className="mt-3 text-sm text-amber-200/90">{slow}</p>}
          {!!files.length && (
            <ul className="mt-4 space-y-1.5 text-sm text-neutral-300">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`} className="flex justify-between gap-3 rounded-2xl bg-white/[0.03] px-3.5 py-2">
                  <span className="truncate">{file.name}</span>
                  <span className="text-white/40 shrink-0">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </li>
              ))}
            </ul>
          )}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="index title" className="mt-4 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="note for the index card" rows={3} className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25" />
          <button onClick={send} disabled={!files.length || busy} className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">
            {busy ? `filing ${step || '…'}` : 'file the pile'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        </motion.section>

        {!!filed.length && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass mt-4 rounded-3xl p-5">
            <p className="text-sm text-neutral-200">landed</p>
            <div className="mt-3 space-y-2">
              {filed.map((row) => (
                <button key={row.id} onClick={() => copy(row.embed)} className="w-full text-left rounded-2xl bg-white/5 px-3.5 py-2.5 border border-white/10">
                  <span className="block text-sm text-white">{row.name}</span>
                  <span className="block text-xs text-white/45 mt-0.5">{copied === row.embed ? 'copied' : row.embed}</span>
                  {row.warn && <span className="block text-xs text-amber-200/80 mt-1">{row.warn}</span>}
                </button>
              ))}
            </div>
            {indexUrl && (
              <button onClick={() => copy(indexUrl)} className="mt-3 w-full text-left rounded-2xl bg-white text-black px-3.5 py-2.5 text-sm font-medium">
                {copied === indexUrl ? 'copied index' : indexUrl}
              </button>
            )}
          </motion.section>
        )}
      </main>
    </div>
  );
}
