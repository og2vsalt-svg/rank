import { motion } from 'framer-motion';

const items = [
  { title: 'folio', href: '/folio', body: 'a reading copy of one local file. bytes land in storage, the title and excerpt land in the folios table. /folio/id is the discord card. large files are warned, never refused. not a vault drawer.' },
  { title: 'swatch', href: '/swatch', body: 'pull five colors from a local image in the tab, then keep the file and the chips in the swatches table. /swatch/id unfurls with the lead color. not a vault drawer.' },
  { title: 'margin', href: '/margin', body: 'notes beside a share that already exists. no new file. /margin/id unfurls in discord without the file itself.' },
  { title: 'apron', href: '/apron', body: 'leave one local file for a person, with a folded note. bytes land in storage and a row in the share table. /apron/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'mantel', href: '/mantel', body: 'a letter shelf beside the files. no upload. discord unfurls /mantel/id. older desks stay.' },
  { title: 'billet', href: '/billet', body: 'file one local file as a delivery slip. the bytes go to storage, a row lands in billets, and /billet/id is the discord card. large slips are warned, never refused. not a vault drawer.' },
  { title: 'ack', href: '/ack', body: 'the receipt board for billets. mark a slip received and the stamp writes back to the same row. discord unfurls /ack. not a file vault.' },
  { title: 'watchglass', href: '/watchglass', body: 'write one local file into the public share table, with a keep note beside it. no size gate, only a slowness note. /watchglass/id is the discord card. not a vault drawer.' },
  { title: 'sandglass', href: '/sandglass', body: 'a public index of watchglass drops already in the database. open one to read the note and the file. discord unfurls /sandglass. not a vault drawer.' },
  { title: 'oakdesk', href: '/oakdesk', body: 'write one local file into the oakdesk table in Postgres. a public url is kept on the row when storage accepts it. no size gate, only a slowness note. /oakdesk/id is the discord card. not a vault drawer.' },
  { title: 'daybook', href: '/daybook', body: 'a page for the day, not a file vault. the note lands in its own table and /daybook/id unfurls in Discord. older desks stay.' },
  { title: 'discord embeds', href: '/s', body: '/s/id plus named paths serve og tags so discord previews look finished. image cards only use real images. bots are rewritten to a card before the app shell.' },
  { title: 'no hard file cap', href: '/vault', body: 'drop whatever size you want. we only warn when the tab might feel sleepy.' },
  { title: 'local-first vault', href: '/vault', body: 'files live in your browser first. nothing ships unless you flip a drop public.' },
  { title: 'cloud share db', href: '/share', body: 'public drops land in supabase, with vercel blob when a token is set.' },
];

export default function Features() {
  return (
    <section className="py-16 px-5" id="features">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">built for dropping files</h2>
        <p className="text-neutral-500 text-sm mb-8">a quiet desk for files, notes, and handoffs. not a cabinet with a size gate. the older desks are still on their routes.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <motion.a key={item.title} href={item.href} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 12) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-6 hover:-translate-y-0.5 transition-transform duration-200">
              <h3 className="text-white font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
