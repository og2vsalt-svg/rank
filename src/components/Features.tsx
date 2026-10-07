import { motion } from 'framer-motion';

const items = [
  { title: 'transom', href: '/transom', body: 'open a receiving window. other people drop a local file into it. bytes land in storage, the slip lands in the database. /transom/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'casement', href: '/casement', body: 'the index of open windows. no file lives on this page. paste /casement in discord for the card. older desks stay.' },
  { title: 'ledger', href: '/ledger/house', body: 'a running book of lines, with an optional amount. no file. /ledger/house unfurls the latest line in discord. not a file vault.' },
  { title: 'fieldbook', href: '/fieldbook', body: 'a page of notes in the fieldbook table. no file. /fieldbook/id is the discord card. older desks stay.' },
  { title: 'stile', href: '/stile', body: 'a short link to any http address. the row lives in relays, not the vault. /stile/id unfurls in discord, then opens the address. causeway still files a local file.' },
  { title: 'inlay', href: '/inlay', body: 'stamp one local file into the pressmarks table. the bytes live in postgres, and /inlay/id is the discord card. large files are warned, never refused. not a vault drawer.' },
  { title: 'parcel', href: '/parcel', body: 'address one local file to a person, with a return note. bytes land in storage and a row in the share table. /parcel/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'seal', href: '/seal', body: 'a local file plus its sha-256. the digest and the bytes stay together. large drops are warned, never refused.' },
  { title: 'handover', href: '/handover', body: 'a local file passed to the next person on a chain. discord cards on /handover/id.' },
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
