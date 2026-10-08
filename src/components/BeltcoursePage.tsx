import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { supabaseConfig } from '../lib/supabase';

type Row = {
  id: string;
  line: string;
  tone: string | null;
  file_name: string | null;
  size: number;
  file_url: string | null;
  author: string | null;
  created_at: string;
};

export default function BeltcoursePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [id, setId] = useState('');
  const [one, setOne] = useState<Row | null>(null);
  const [note, setNote] = useState('reading the wall…');

  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const maybe = parts[0] === 'beltcourse' && parts[1] ? decodeURIComponent(parts[1]) : '';
    setId(maybe);
    const q = maybe
      ? `id=eq.${encodeURIComponent(maybe)}&select=*&limit=1`
      : 'select=*&order=created_at.desc&limit=24';
    fetch(`${supabaseConfig.url}/rest/v1/stringcourses?${q}`, {
      headers: { apikey: supabaseConfig.anonKey, Authorization: `Bearer ${supabaseConfig.anonKey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        if (maybe) setOne(list[0] || null);
        else setRows(list);
        setNote(list.length ? '' : 'nothing set on this course yet.');
      })
      .catch(() => setNote('could not read the table.'));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">public index</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">{id ? 'one course' : 'beltcourse'}</h1>
          <p className="text-neutral-400 text-sm mb-8">Courses already filed. Open one for the file. Discord unfurls /beltcourse. Not a cabinet.</p>
          {one ? (
            <article className="glass rounded-[28px] p-6">
              <p className="text-white text-xl leading-snug mb-3">{one.line}</p>
              <p className="text-xs text-neutral-500 mb-4">{one.tone || 'plain'} · {one.author || 'unsigned'} · {one.file_name || 'file'}</p>
              {one.file_url ? <a className="text-sm text-[#64b5ff]" href={one.file_url}>download the file</a> : <p className="text-sm text-neutral-500">no file url on this row.</p>}
            </article>
          ) : null}
          {!id && rows.map((row, i) => (
            <motion.a key={row.id} href={`/beltcourse/${row.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="block glass rounded-3xl p-5 mb-3 hover:-translate-y-0.5 transition-transform">
              <p className="text-white">{row.line}</p>
              <p className="text-xs text-neutral-500 mt-1">{row.tone} · {row.file_name}</p>
            </motion.a>
          ))}
          {note ? <p className="text-sm text-neutral-500">{note}</p> : null}
          <a href="/stringcourse" className="inline-block mt-6 text-sm text-neutral-400 hover:text-white">set a new course</a>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
