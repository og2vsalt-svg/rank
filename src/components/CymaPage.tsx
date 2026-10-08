import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function CymaPage() {
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'large file. hashing and sending may feel slow. nothing is refused.' : ''),
    [file],
  );

  useEffect(() => {
    let live = true;
    sbRest('astragals?select=id,name,sha256,size,note,author,created_at&order=created_at.desc&limit=8')
      .then((r) => r.json())
      .then((data) => { if (live && Array.isArray(data)) setRows(data); })
      .catch(() => {});
    return () => { live = false; };
  }, [link]);

  async function onFile(next: File | null) {
    setFile(next);
    setHash('');
    if (!next) return;
    try { setHash(await sha256(next)); } catch { setHash(''); }
  }

  async function fileCurve() {
    setError('');
    setLink('');
    if (!file) {
      setError('choose a local file. bytes go to the share table, the curve goes to astragals.');
      return;
    }
    setBusy(true);
    try {
      const digest = hash || (await sha256(file));
      const published = await publishLocalFile(file, {
        caption: note.trim() || 'cyma curve',
        author: author.trim() || undefined,
        cardTitle: file.name,
        color: '#0a84ff',
        meta: { kind: 'cyma', sha256: digest, note: note.trim() },
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the file did not land.');
        return;
      }
      await sbRest('astragals', {
        method: 'POST',
        body: JSON.stringify({
          id: published.id,
          share_id: published.id,
          name: file.name,
          sha256: digest,
          size: file.size,
          note: note.trim() || null,
          author: author.trim() || null,
          file_url: published.url || null,
        }),
      });
      setWarn(published.warn || slow);
      setLink(`${location.origin}/cyma/${published.id}`);
    } catch (e: any) {
      setError(e?.message || 'could not file the curve.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.18em] uppercase text-white/40">a double curve, not a drawer</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">cyma</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
            Hash a local file in the browser, file the bytes, keep the checksum beside the share. Older desks stay on their routes. Discord unfurls /cyma.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="space-y-4">
            <label className="block text-sm text-neutral-300">who filed it
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" placeholder="optional" />
            </label>
            <label className="block text-sm text-neutral-300">curve note
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={180} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" placeholder="what this curve is holding" />
            </label>
            <label className="block text-sm text-neutral-300">local file
              <input type="file" onChange={(e) => onFile(e.target.files?.[0] || null)} className="mt-1.5 block w-full text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black" />
            </label>
            {file ? <p className="text-xs text-neutral-500">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB. no size cap.</p> : null}
            {hash ? <p className="text-xs text-white/45 break-all">sha-256 {hash}</p> : null}
            {slow ? <p className="text-xs text-[#ff9f0a]">{slow}</p> : null}
            {error ? <p className="text-sm text-[#ff453a]">{error}</p> : null}
            {warn ? <p className="text-xs text-[#ff9f0a]">{warn}</p> : null}
            {link ? <motion.a initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} href={link} className="block text-sm text-[#64b5ff] break-all">{link}</motion.a> : null}
            <button disabled={busy} onClick={fileCurve} className="w-full rounded-full bg-[#0a84ff] text-white py-3 text-sm font-medium hover:bg-[#409cff] active:scale-[0.98] transition disabled:opacity-60">{busy ? 'filing…' : 'file the curve'}</button>
          </div>
        </motion.div>
        <section className="mt-10 space-y-3">
          {rows.map((row) => (
            <motion.a key={row.id} href={`/s/${row.share_id || row.id}`} whileHover={{ y: -2 }} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-sm text-white">{row.name}</p>
              <p className="mt-1 text-xs text-white/40 break-all">{row.sha256}</p>
              {row.note ? <p className="mt-1 text-xs text-white/55">{row.note}</p> : null}
            </motion.a>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
