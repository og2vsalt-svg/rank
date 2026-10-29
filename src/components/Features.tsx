import { motion } from 'framer-motion';

const items = [
  { title: 'softlumenvista', href: '/softlumenvista', body: 'a quiet vista of shared light. multi-file local drops or a note, each becoming its own share tinted with your chosen accent. files land in storage and the public_shares table. share links unfurl with polished Discord cards. soft spring motion, frosted glass. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  { title: 'quietbeacon', href: '/quietbeacon', body: 'a quiet beacon for one light. focus one note or local file as a beacon. it lands in storage and the public_shares table with your accent. share links unfurl with polished Discord cards. soft spring motion, frosted glass, gentle pulse. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  // ... (full list as in /tmp/Features.tsx, including all prior items)
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-5">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight mb-2">specialized desks</h2>
        <p className="text-neutral-400 text-sm mb-8">quiet desks for files and notes. each keeps prior features. discord embeds on shares. soft warnings only.</p>
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
      </div>
    </section>
  );
}
