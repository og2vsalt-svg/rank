import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile } from '../lib/cloudShare';
import { supabaseConfig } from '../lib/supabase';

const TONES = ['warm stone', 'cool plaster', 'ink', 'brass', 'night'];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function StringcoursePage() {
  const [line, setLine] = useState('');
  const [tone, setTone] = useState(TONES[0]);
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');

  const slow = useMemo(() => (file && file.size > 40 * 1024 * 1024 ? 'this drop is large. the tab may feel slow while it sends. nothing is refused.' : ''), [file]);

  async function fileIt() {
    setError('');
    setLink('');
    if (!line.trim()) {
      setError('write the line that sits on the wall.');
      return;
    }
    if (!file) {
      setError('choose a local file. it lands in the share table, not only on this machine.');
      return;
    }
    setBusy(true);
    try {
      const published = await publishLocalFile(file, {
        caption: line.trim(),
        author: author.trim() || undefined,
        cardTitle: line.trim().slice(0, 80),
        color: tone === 'ink' ? '#1d1d1f' : '#0a84ff',
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the file did not land.');
        return;
      }
      const id = uid();
      const row = {
        id,
        line: line.trim(),
        tone,
        file_name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: published.url,
        share_id: published.id,
        author: author.trim() || null,
      };
      const res = await fetch(`${supabaseConfig.url}/rest/v1/stringcourses`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text.slice(0, 180) || 'the line did not land in the table.');
        return;
      }
      setWarn(published.warn || slow);
      setLink(`${location.origin}/stringcourse/${id}`);
    } catch (e: any) {
      setError(e?.message || 'something slipped.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 px-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto">
          <p className="text-[#0a84ff] text-sm font-medium mb-3">a band on the wall, not a drawer</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">stringcourse</h1>
          <p className="text-neutral-400 leading-relaxed mb-8">One line, one local file. The bytes go to storage and the share table. The line goes to stringcourses. Discord unfurls the link. Large files get a warning, never a refusal. The older desks stay where they are.</p>
          <div className="glass rounded-[28px] p-6 space-y-4">
            <label className="block text-sm text-neutral-300">
              the line
              <input value={line} onChange={(e) => setLine(e.target.value)} maxLength={280} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" placeholder="what the band should say" />
            </label>
            <label className="block text-sm text-neutral-300">
              tone
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none">
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-neutral-300">
              signed
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" placeholder="optional" />
            </label>
            <label className="block text-sm text-neutral-300">
              local file
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1.5 block w-full text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black" />
            </label>
            {file ? <p className="text-xs text-neutral-500">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB. no size cap.</p> : null}
            {slow ? <p className="text-xs text-[#ff9f0a]">{slow}</p> : null}
            {error ? <p className="text-sm text-[#ff453a]">{error}</p> : null}
            {warn ? <p className="text-xs text-[#ff9f0a]">{warn}</p> : null}
            {link ? (
              <motion.a initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} href={link} className="block text-sm text-[#64b5ff] break-all">{link}</motion.a>
            ) : null}
            <button disabled={busy} onClick={fileIt} className="w-full rounded-full bg-[#0a84ff] text-white py-3 text-sm font-medium hover:bg-[#409cff] active:scale-[0.98] transition disabled:opacity-60">{busy ? 'sending…' : 'set the course'}</button>
          </div>
          <a href="/beltcourse" className="inline-block mt-6 text-sm text-neutral-400 hover:text-white transition">see courses already set</a>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
