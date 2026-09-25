import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function TomePage() {
  const { addText, files } = useVault();
  const [title, setTitle] = useState('untitled note');
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState('');
  const notes = files.filter((f) => f.folder === 'tome' || f.type === 'text/plain');

  const save = async () => {
    const name = title.endsWith('.txt') ? title : `${title}.txt`;
    const res = await addText(name, body, 'tome');
    setMsg(res.ok ? 'saved to vault · tome folder' : res.error || 'could not save');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">tome</p>
          <h1 className="text-3xl font-semibold mb-3">write here. it lives with your files.</h1>
          <p className="text-neutral-400 text-sm mb-6">a notepad that writes straight into the vault. not a file picker — just words that stick.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 rounded-2xl px-4 py-3 mb-3 outline-none text-white"
            placeholder="title"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full bg-white/5 rounded-2xl px-4 py-3 mb-4 outline-none text-neutral-200 leading-relaxed resize-y"
            placeholder="start writing…"
          />
          <button onClick={save} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">save to vault</button>
          {msg && <p className="text-xs text-neutral-500 mt-3">{msg}</p>}
          {notes.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-xs text-neutral-500 mb-3">recent notes</p>
              <div className="space-y-2">
                {notes.slice(0, 8).map((n) => (
                  <p key={n.id} className="text-sm text-neutral-300">{n.name} <span className="text-neutral-600">· {Math.round(n.size / 10) / 100} kb</span></p>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
