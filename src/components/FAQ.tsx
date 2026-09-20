import { useState } from 'react';

const faqs = [
  {
    q: 'where do files actually live?',
    a: 'in this build they stay in your browser storage. same device, same vault.',
  },
  {
    q: 'can other people see my files?',
    a: 'only if you flip a file to public and send them the share link. private files never render on the share page.',
  },
  {
    q: 'do i need an account?',
    a: 'yeah, just so the vault knows which pile is yours. signup is local to this site.',
  },
  {
    q: 'what file types work?',
    a: 'anything. images, clips, zips, pdfs, raw text snippets. preview is nicest for media.',
  },
  {
    q: 'can i organize stuff?',
    a: 'folders, albums, rename, favorites, color dots, search, grid or list. pretty much the usual kit.',
  },
  {
    q: 'is there a file size limit?',
    a: 'no hard cap. huge drops just warn that the tab might get sleepy while it encodes.',
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-sm text-white font-medium pr-4 group-hover:text-[#0a84ff] transition-colors">{q}</span>
        <span className={`text-neutral-600 text-lg shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-40 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm text-neutral-500 leading-relaxed -mt-1">{a}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section className="py-16 px-5" id="faq">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-1 tracking-tight">faq</h2>
        <p className="text-neutral-500 text-sm mb-8">short answers, no sales pitch.</p>
        <div className="glass rounded-3xl px-5">
          {faqs.map((f, i) => (
            <Item key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
