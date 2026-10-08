import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

export default function RegletPage() {
  const [mark, setMark] = useState('');
  const [at, setAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'large strip. the send may feel slow. it is not refused.' : ''),
    [file],
  );

  useEffect(() => {
    let live = true;
    sbRest('ogees?select=id,share_id,mark,at_label,created_at&order=created_at.desc&limit=8')
      .then((r) => r.json())
      .then((data) => { if (live && Array.isArray(data)) setRows(data); })
      .catch(() => {});
    return () => { live = false; };
  }, [link]);

  async function leave() {
    setError('');
    setLink('');
    if (!mark.trim()) {
      setError('leave a mark. the file is optional.');
      return;
    }
    setBusy(true);
    try {
      let shareId: string | null = null;
      if (file) {
        const published = await publishLocalFile(file, {
          caption: mark.trim(),
          cardTitle: file.name,
          color: '#64d2ff',
          meta: { kind: 'reglet', at: at.trim(), mark: mark.trim() },
        });
        if (!published.ok || !published.id) {
          setError(published.error || 'the file did not land.');
          return;
        }
        shareId = published.id;
        setWarn(published.warn || slow);
      }
      const id = shareId || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
      const saved = await sbRest('ogees', {
        method: 'POST',
        body: JSON.stringify({ id, share_id: shareId, mark: mark.trim(), at_label: at.trim() || null }),
      });
      if (!saved.ok) {
        setError((await saved.text()) || 'the strip did not save.');
        return;
      }
      setLink(`${location.origin}/reglet/${id}`);
    } catch (e: any) {
      setError(e?.message || 'could not leave the strip.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.18em] uppercase text-white/40">a narrow strip</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">reglet</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
            A place-mark on a recording or a long file. An optional local drop lands in the share table. The strip itself is not a vault. Discord unfurls /reglet.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <div className="space-y-4">
            <label className="block text-sm text-neutral-300">mark
              <input value={mark} onChange={(e) => setMark(e.target.value)} maxLength={180} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#64d2ff]/60 transition" placeholder="left off at the second chorus" />
            </label>
            <label className="block text-sm text-neutral-300">where
              <input value={at} onChange={(e) => setAt(e.target.value)} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#64d2ff]/60 transition" placeholder="12:40, page 40" />
            </label>
            <label className="block text-sm text-neutral-300">local file, if you want one
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1.5 block w-full text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black" />
            </label>
            {file ? <p className="text-xs text-neutral-500">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB. no size cap.</p> : null}
            {slow ? <p className="text-xs text-[#ff9f0a]">{slow}</p> : null}
            {error ? <p className="text-sm text-[#ff453a]">{error}</p> : null}
            {warn ? <p className="text-xs text-[#ff9f0a]">{warn}</p> : null}
            {link ? <motion.a initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} href={link} className="block text-sm text-[#64b5ff] break-all">{link}</motion.a> : null}
            <button disabled={busy} onClick={leave} className="w-full rounded-full bg-[#64d2ff] text-black py-3 text-sm font-medium hover:bg-[#8adfff] active:scale-[0.98] transition disabled:opacity-60">{busy ? 'leaving…' : 'leave the strip'}</button>
          </div>
        </motion.div>
        <section className="mt-10 space-y-3">
          {rows.map((row) => (
            <a key={row.id} href={row.share_id ? `/s/${row.share_id}` : `/reglet/${row.id}`} className="block rounded-2xl border border-white/10 px-4 py-3 hover:-translate-y-0.5 transition">
              <p className="text-sm">{row.mark}</p>
              <p className="text-xs text-white/45 mt-1">{row.at_label || 'no place marked'}</p>
            </a>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
