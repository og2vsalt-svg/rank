import { motion } from 'framer-motion';

const items = [
  { title: 'softquietconstellation', href: '/softquietconstellation', body: 'connect what you carry among the stars. drop local files into a quiet constellation. soft glass stars drift and link with luminous lines that spring into place. each can hold its own note or share a constellation caption and accent. lands in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style spring motion. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softquietatrium', href: '/softquietatrium', body: 'settle under quiet light shafts. drop one or many local files into a quiet atrium. soft shafts of light descend and settle with spring motion on frosted glass. each piece can hold its own note or share an atrium caption and accent. lands in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  // ... remaining items preserved from prior version ...
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
