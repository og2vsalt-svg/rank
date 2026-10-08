import { motion } from 'framer-motion';

const items = [
  { title: 'keystone', href: '/keystone', body: 'pin one local file to a place with a reading. bytes land in storage and the keystones table. /keystone/id is the discord card. large drops are warned, never refused. not a vault drawer. older desks stay.' },
  { title: 'voussoir', href: '/voussoir', body: 'the public arch of keystone pins. open one to read the place and the file. discord unfurls /voussoir. not a cabinet.' },
  { title: 'loft', href: '/loft', body: 'hang one local file in a room with a title and caption. bytes land in storage and the lofts table. /loft/id is the discord card. large drops are warned, never refused. not a vault drawer. older desks stay.' },
  { title: 'eaves', href: '/eaves', body: 'the public index of loft rooms already filed. open one to read the caption and the file. discord unfurls /eaves. not a cabinet.' },
  { title: 'haversack', href: '/haversack', body: 'send one local file with an errand. the row lands in the couriers table, and smaller files keep a byte copy in Postgres. /haversack/id is the discord card. large drops are warned, never refused. not a vault drawer. the satchel and courier desks stay.' },
  { title: 'pegboard', href: '/pegboard', body: 'the public board of haversacks already sent. open one to download, or mark it picked up. discord unfurls /pegboard. not a cabinet.' },
  { title: 'cloud share db', href: '/share', body: 'public drops land in supabase, with vercel blob when a token is set. no hard file cap, only a slowness warning.' },
];

export default function Features() {
  return (
    <section className="py-16 px-5" id="features">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">built for dropping files</h2>
        <p className="text-neutral-500 text-sm mb-8">a quiet desk for files, notes, and handoffs. not a cabinet with a size gate. the older desks are still on their routes.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <motion.a key={item.href + item.title} href={item.href} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 12) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-6 hover:-translate-y-0.5 transition-transform duration-200">
              <h3 className="text-white font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
