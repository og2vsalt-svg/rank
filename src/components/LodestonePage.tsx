import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LodestonePage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [heading, setHeading] = useState('');
  const [remark, setRemark] = useState('');
  const [author, setAuthor] = useState('');
  const [warn, setWarn] = useState('');
  const [status, setStatus] = useState('the file stays on this machine until you set the heading.');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);

  function pick(next: File | null) {
    setFile(next);
    setCard('');
    if (next && next.size > 8 * 1024 * 1024) setWarn('this one is heavy. lodestone will still take it, but the transfer can feel slow.');
    else setWarn('');
  }

  async function fileIt() {
    if (!file || busy) return;
    setBusy(true);
    setStatus('writing the share row…');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('heading', heading.trim());
      body.append('remark', remark.trim());
      body.append('author', author.trim());
      const r = await fetch('/api/lodestone', { method: 'POST', body });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.id) throw new Error(data.error || 'the share table did not take the file');
      const path = `${window.location.origin}/lodestone/${data.id}`;
      setCard(path);
      setStatus(data.warn || 'filed. paste the link in Discord.');
      if (data.warn) setWarn(data.warn);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file that drop');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">heading desk</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">lodestone</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">Point a local file somewhere. It is written into the public share table with a heading, not dropped into a vault drawer. There is no size gate. A heavy file only gets a note that it may feel slow.</p>
        </motion.div>
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          <label className="flex cursor-pointer flex-col items-center rounded-[22px] border border-dashed border-black/10 bg-[#f5f5f7] px-6 py-10 text-center transition duration-300 hover:-translate-y-0.5">
            <span className="text-[15px] font-medium">{file ? file.name : 'choose a file from this machine'}</span>
            <span className="mt-1 text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'nothing is uploaded until you set the heading'}</span>
            <input type="file" className="sr-only" onChange={(e) => pick(e.target.files?.[0] || null)} />
          </label>
          <input value={heading} onChange={(e) => setHeading(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="heading, like studio or press" />
          <input value={remark} onChange={(e) => setRemark(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="a short remark for the card" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="your name, optional" />
          {warn && <p className="mt-3 text-[13px] text-[#b25000]">{warn}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={fileIt} disabled={!file || busy} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white transition duration-300 hover:bg-black active:scale-[0.98] disabled:opacity-40">{busy ? 'filing…' : 'set heading'}</button>
            <button type="button" onClick={() => navigate('mariner')} className="rounded-full bg-[#f5f5f7] px-5 py-2.5 text-[14px] font-medium text-[#1d1d1f] transition duration-300 hover:-translate-y-0.5">open mariner</button>
          </div>
          <p className="mt-4 text-[13px] text-[#6e6e73]">{status}</p>
          {card && (
            <p className="mt-2 break-all text-[14px] text-[#0A84FF]"><a href={card}>{card}</a></p>
          )}
        </motion.section>
      </main>
    </div>
  );
}
