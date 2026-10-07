import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { prettySize } from '../lib/db';

const SLOW = 12 * 1024 * 1024;

export default function PorchPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [forName, setForName] = useState('');
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<any>(null);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/porch?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setRow(data);
      })
      .catch(() => setError('could not open this porch'));
  }, [shareId]);

  async function leave(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('choose a file from this machine');
      return;
    }
    setBusy(true);
    setError('');
    setWarn(file.size > SLOW ? 'large drop. it will still go up. preview clients may feel slow.' : '');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/porch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, name: file.name, type: file.type, size: file.size, forName, author, caption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'porch did not take the file');
      if (data.warn) setWarn(data.warn);
      const path = data.sharePath || `/porch/${data.id}`;
      setLink(window.location.origin + path);
      navigate('porch', data.id);
    } catch (err: any) {
      setError(err.message || 'porch failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto">
          <p className="text-[#0a84ff] text-sm font-medium mb-2">a doorbell, not a cabinet</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">leave it on the porch.</h1>
          <p className="text-neutral-400 mb-8 leading-relaxed">One file, one name, one spoken line. It lands in the share table. There is no size cap — only a warning if the drop may feel slow. Paste the link in Discord for a card.</p>
          {row && row.url ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">for {row.forName || 'someone'}</p>
              <h2 className="text-2xl text-white font-semibold tracking-tight">{row.name}</h2>
              <p className="text-neutral-400 mt-2">{row.caption || 'left without a line.'}</p>
              <p className="text-sm text-neutral-500 mt-3">{prettySize(row.size)}{row.author ? ` · from ${row.author}` : ''}</p>
              {row.warn && <p className="text-amber-300/90 text-sm mt-3">{row.warn}</p>}
              <a href={row.url} className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium" download>take the file</a>
            </motion.div>
          ) : (
            <form onSubmit={leave} className="glass rounded-3xl p-6 space-y-4">
              <label className="block text-sm text-neutral-300">
                for
                <input value={forName} onChange={(e) => setForName(e.target.value)} placeholder="their name" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60" />
              </label>
              <label className="block text-sm text-neutral-300">
                a line
                <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="left this by the door" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60" />
              </label>
              <label className="block text-sm text-neutral-300">
                from
                <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60" />
              </label>
              <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file ? `${file.name} · ${prettySize(file.size)}` : 'choose a file on this machine'}
              </label>
              {file && file.size > SLOW && <p className="text-amber-300/90 text-sm">large drop. it will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {link && <p className="text-sm text-[#64d2ff] break-all">{link}</p>}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition">{busy ? 'leaving it…' : 'leave it on the porch'}</button>
            </form>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
