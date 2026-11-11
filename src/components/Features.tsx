import { motion } from 'framer-motion';

const items = [
  { title: 'soft quiet chronicle', href: '/softquietchronicle', body: 'Dated quiet notes and optional files that settle into the database. Each entry returns a polished Discord embed. Soft slow warnings only. No hard limits.' },
  { title: 'lumen orbit', href: '/lumenorbit', body: 'Files settle into a quiet orbit. Multi-file drop with shared caption and accent. Soft spring motion, Discord embeds. Soft size warnings only.' },
  { title: 'canvas note', href: '/canvasnote', body: 'Draw a quiet note on dark glass. Share the image to the database with a polished Discord card. Soft warnings only.' },
  { title: 'quiet timeline', href: '/quiettimeline', body: 'Calm vertical stream of recent public shares. Spring-entry cards. Every link carries a professional Discord embed.' },

  { title: 'soft quiet lumen', href: '/softquietlumen', body: 'Let files glow into place. Multi-file local upload with shared caption and warm accent. Soft pulsing glow, spring motion, Discord embeds. Soft size warnings only.' },
  { title: 'soft quiet harbor', href: '/softquietharbor', body: 'Files settle like boats in a quiet harbor. Multi-file drops with shared note and ripples. Lands in the database with polished Discord cards. No hard limits.' },
  { title: 'quiet notes', href: '/quietnotes', body: 'A small desk for short text notes. Upload plain text to the database with professional Discord embeds. Soft warnings only. All prior file desks remain.' },
  { title: 'soft quiet atrium', href: '/softquietatrium', body: 'Settle under quiet light shafts. Drop local files. Soft shafts of light, spring motion, Discord embeds on shares. Soft size warnings only.' },
  { title: 'soft quiet vault', href: '/softquietvault', body: 'Private local vault with cloud shares. Upload to database, professional Discord cards. Large files warned, never refused.' },
  { title: 'public board', href: '/publicboard', body: 'Browse recent public shares. Polished embeds, human-crafted animations.' },
  { title: 'soft quiet constellation', href: '/softquietconstellation', body: 'Connect files among the stars. Multi-file drops with linked glass stars and spring animations.' },
  { title: 'soft quiet meadow', href: '/softquietmeadow', body: 'Blooming glass flowers for your files. Each can hold notes. Discord-ready links.' },
  { title: 'soft quiet veil', href: '/softquietveil', body: 'Settle files behind soft light layers. Translucent motion, embeds on every share.' },
  { title: 'direct share', href: '/directshare', body: 'Upload a local file straight to the database and get a pro Discord embed link instantly. Soft warnings for large drops.' },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-5">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight mb-2">specialized desks</h2>
        <p className="text-neutral-400 text-sm mb-8">quiet desks for files and notes. each keeps prior features. discord embeds on shares. soft warnings only. no hard limits.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => (
            <motion.a
              key={item.title}
              href={item.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 20 }}
              className="glass rounded-2xl p-5 block hover:bg-white/5 transition"
            >
              <p className="text-sm font-medium mb-1.5">{item.title}</p>
              <p className="text-xs text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.a>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-6 text-center">All prior desks and features remain fully intact. New ones added carefully. Human-crafted Apple-style animations throughout.</p>
      </div>
    </section>
  );
}
