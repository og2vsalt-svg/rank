import { motion } from 'framer-motion';

const items = [
  { title: 'leecloth', href: '/leecloth', body: 'write one local file into the leechoth table in Postgres. smaller files keep a byte copy on the row. larger ones land in the share table, then the row keeps the link. /leecloth/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'crossjack', href: '/crossjack', body: 'a watch log, not a file vault. the note lands in Postgres and /crossjack/id unfurls in Discord. older desks stay.' },
  { title: 'coak', href: '/coak', body: 'write one local file straight into the sheaves table in Postgres. the bytes stay on the row, and /coak/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'sheaveboard', href: '/sheaveboard', body: 'a public index of coak files already in the database. open one to read the note and download the file. discord unfurls /sheaveboard. the older sheave pack desk stays at /sheave.' },
  { title: 'vellum', href: '/vellum', body: 'write one local file into the vellum table in Postgres. smaller files keep a byte copy on the row, and a share link sits beside it. /vellum/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'vellumboard', href: '/vellumboard', body: 'a public index of sheets already in the database. open one to read the note and download the file. discord unfurls /vellumboard. not a vault drawer.' },
  { title: 'splice', href: '/splice', body: 'pair two local files. both land in the share table, hashes stay on the splice row, and /splice/id is the discord card. large pairs are warned, never refused. not a vault drawer.' },
  { title: 'serving', href: '/serving', body: 'a public index of splices already filed. open one to compare names, sizes, and hashes. discord unfurls /serving. not a vault drawer.' },
  { title: 'grommet', href: '/grommet', body: 'label a local file for someone. the bytes land in the share table, and a grommet row keeps the note. /grommet/id is the card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'ring', href: '/ring', body: 'a public index of labeled drops already filed. open one to read the note and the file. discord unfurls /ring. not a vault drawer.' },
  { title: 'quoin', href: '/quoin', body: 'name a corner and attach one local file. the bytes land in the share table, and a corner row keeps the note. /quoin/id is the card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'rebate', href: '/rebate', body: 'a public index of quoin corners already filed. open one to read the note and the file. discord unfurls /rebate. not a vault drawer.' },
  { title: 'newel', href: '/newel', body: 'a stair note with no file attached. older desks stay. discord unfurls /newel. not a file vault.' },
  { title: 'deadlight', href: '/deadlight', body: 'name a pane and attach one local file. the bytes land in the share table, and a pane row keeps the note. /deadlight/id is the card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'beeswax', href: '/beeswax', body: 'a public index of deadlight panes already filed. open one to read the note and the file. discord unfurls /beeswax. not a vault drawer.' },
  { title: 'holdfast', href: '/holdfast', body: 'pin one local file with a keeper note. the bytes land in the share table, then /holdfast/id is the card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'clew', href: '/clew', body: 'a public index of holdfast pins already in the share table. open one to read the note and the file. discord unfurls /clew. not a vault drawer.' },
  { title: 'tender', href: '/tender', body: 'ask one question and attach one local file. the bytes land in the share table, replies stay on the tender. discord unfurls /tender. large files are warned, never refused. not a vault drawer.' },
  { title: 'gangway', href: '/gangway', body: 'a public index of open tenders. open one to read the question and the file already stored. discord unfurls /gangway. not a vault drawer.' },
  { title: 'cask', href: '/cask', body: 'bundle several local files. each one lands in the share table, then a cask row keeps the list. discord unfurls /cask. large bundles are warned, never refused. not a vault drawer.' },
  { title: 'stave', href: '/stave', body: 'a public index of casks. open one to see the files already stored. discord unfurls /stave. not a vault drawer.' },
  { title: 'slip', href: '/slip', body: 'a shared table. pick a short code, drop a local file, and the bytes land in the share database. discord unfurls /slip. large drops are warned, never refused. not a vault drawer.' },
  { title: 'wick', href: '/wick', body: 'attach a local file and pick how long the link stays warm. bytes land in the share table, then the row fades. discord unfurls /wick. large drops are warned, never refused. not a vault drawer.' },
  { title: 'handoff', href: '/handoff', body: 'name a person, attach a local file, and the bytes land in the share table. discord unfurls /handoff. not a vault drawer. large drops are warned, never refused.' },
  { title: 'proof', href: '/proof', body: 'sha-256 a local file in the tab and file the checksum. optional text slip. no size cap, only a slowness warning.' },
  { title: 'quiet', href: '/quiet', body: 'a short note that burns after a set number of reads. discord gets a card, not the text.' },
  { title: 'springline', href: '/springline', body: 'a hold note with an optional local file. the file lands in the share table. discord unfurls /springline. large drops are warned, never refused. not a vault drawer.' },
  { title: 'spunyarn', href: '/spunyarn', body: 'tie a short note to a local file. bytes land in the share table. discord unfurls /spunyarn. large drops are warned, never refused. not a vault drawer.' },
  { title: 'eyelet', href: '/eyelet', body: 'a ring of spunyarn ids you can pass around. the files stay on their yarns. discord unfurls /eyelet.' },
  { title: 'plinth', href: '/plinth', body: 'name a place, write a dedication, and the local file lands in the share table. discord unfurls /plinth and /s. slowness warning only. not a vault drawer.' },
  { title: 'corbel', href: '/corbel', body: 'write what a file is holding up, and who it carries. bytes land in the share table. discord unfurls /corbel and /s. large drops are warned, never refused.' },
  { title: 'vitrine', href: '/vitrine', body: 'dress a Discord card before the file lands in the share table. no size gate, only a slowness note. /s unfurls the file.' },
  { title: 'pressmark', href: '/pressmark', body: 'paint a 1200\u00d7630 cover in the tab and file the png so Discord has a real image. not a vault drawer.' },
  { title: 'trundle', href: '/trundle', body: 'a handoff slip for someone else. the local file lands in the share table. discord unfurls /trundle.' },
  { title: 'coping', href: '/coping', body: 'a checklist beside an optional local file. discord unfurls /coping. older desks stay.' },
  { title: 'discord embeds', href: '/s', body: '/s/id plus named paths serve og tags so discord previews look finished. image cards only use real images.' },
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
