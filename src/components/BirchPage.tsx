import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function parseTable(text: string): string[][] {
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean).slice(0, 80);
  if (!lines.length) return [];
  if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      const keys = Object.keys(arr[0] || {});
      return [keys, ...arr.slice(0, 60).map((row: any) => keys.map((k) => String(row?.[k] ?? '')))];
    } catch { /* fall through */ }
  }
  const delim = lines[0].includes('\t') ? '\t' : ',';
  return lines.map((l) => l.split(delim).map((c) => c.replace(/^"|"$/g, '')));
}

export default function BirchPage() {
  const [rows, setRows] = useState<string[][]>([]);
  const [warn, setWarn] = useState('');
  const [name, setName] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setName(f.name);
    if (f.size > 12 * 1024 * 1024) setWarn('wide sheet. parse still runs, ui might hitch. no cap.');
    const text = await f.text();
    setRows(parseTable(text));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8 overflow-hidden">
          <p className="text-[#0a84ff] text-sm mb-2">birch</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read a sheet on device.</h1>
          <p className="text-neutral-400 text-sm mb-6">csv or json table preview. does not upload. not a vault clone.</p>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-8 text-center mb-5 hover:border-[#0a84ff]/40 transition">
            <input type="file" accept=".csv,.tsv,.json,text/csv,application/json" className="hidden" onChange={(e) => onFile(e.target.files)} />
            {name || 'drop csv or json'}
          </label>
          {rows.length > 0 && (
            <div className="overflow-auto max-h-[480px] rounded-2xl border border-white/5">
              <table className="w-full text-xs">
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={i === 0 ? 'text-white bg-white/5' : 'text-neutral-400'}>
                      {r.slice(0, 12).map((c, j) => (
                        <td key={j} className="px-3 py-2 border-b border-white/5 truncate max-w-[160px]">{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
