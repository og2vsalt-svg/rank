import { motion } from 'framer-motion';

const items = [
  { title: 'oriel', href: '/oriel', body: 'a bay window for one local file and a line under the glass. bytes land in the share table. discord unfurls /oriel. large drops are warned, never refused.' },
  { title: 'quillon', href: '/quillon', body: 'a guard slip: who the file is for, and the promise that travels with it. not a vault list. discord unfurls /quillon.' },
  { title: 'architrave', href: '/architrave', body: 'a beam over the door, not a drawer. drop a local file into the share table, name who it carries, and leave a line. someone else can answer on /taenia without uploading. discord unfurls /architrave. large drops are warned, never refused. older desks stay.' },
  { title: 'taenia', href: '/taenia', body: 'the public band of beams already set. open one to read the line, download the file, and leave a reply. no new upload on this page. discord unfurls /taenia. not a cabinet.' },
  { title: 'lantern', href: '/lantern', body: 'a reading room beside the vault. drop a local file into the share table, leave a margin, and hand over the link. discord unfurls /lantern. large drops are warned, never refused. older desks stay.' },
  { title: 'impost', href: '/impost', body: 'a line that stays quiet until a time you pick. an optional local file lands in the share table. discord unfurls /impost. large drops are warned, never refused. not a vault drawer. older desks stay.' },
  { title: 'scotia', href: '/scotia', body: 'where you listened, for how long, in what mood. an optional local file lands in the share table. discord unfurls /scotia. large drops are warned, never refused. not a cabinet.' },
  { title: 'modillion', href: '/modillion', body: 'a short thanks for a share that already exists. optional local file. discord unfurls /modillion. large drops are warned, never refused. older desks stay.' },
  { title: 'hoodmold', href: '/hoodmold', body: 'hang one local file over a door for a named person. bytes land in storage and the share table. discord unfurls /hoodmold. large drops are warned, never refused. not a vault drawer. older desks stay.' },
  { title: 'gutta', href: '/gutta', body: 'the public index of hoodmolds already hung. open one to read the drip and download the file. discord unfurls /gutta. not a cabinet.' },
  { title: 'echinus', href: '/echinus', body: 'three words, filed as a note in the share table. no disk upload. discord unfurls /echinus. not a file vault.' },
  { title: 'cavetto', href: '/cavetto', body: 'a reading hollow. an optional local file lands in the share table, or the passage itself is filed. discord unfurls /cavetto. large drops are warned, never refused.' },
  { title: 'lintel', href: '/lintel', body: 'hang one local file over a doorway and let people knock. bytes land in storage and the share table. the greeting lives in lintels. /lintel/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'sill', href: '/sill', body: 'leave a note on the window. no file. optional link back to a lintel. /sill/id unfurls in discord. older desks stay.' },

  { title: 'stringcourse', href: '/stringcourse', body: 'one line on the wall and one local file. bytes land in storage and the share table, the line lands in stringcourses. discord unfurls /stringcourse. large drops are warned, never refused. not a vault drawer. older desks stay.' },
  { title: 'beltcourse', href: '/beltcourse', body: 'the public index of courses already set. open one to read the line and download the file. discord unfurls /beltcourse. not a cabinet.' },
  { title: 'spandrel', href: '/spandrel', body: 'two notes framing one local file. bytes land in the share table, the lines land in spandrels. discord unfurls /spandrel. large drops are warned, never refused. not a vault drawer. older desks stay.' },
  { title: 'fascia', href: '/fascia', body: 'the line people read before the file. a local file lands in the share table, the face line lands in fascia. discord unfurls /fascia. large drops are warned, never refused. not a vault drawer.' },
  { title: 'finial', href: '/finial', body: 'a closing mark on a share that already exists. no new file. discord unfurls /finial. older desks stay.' },
  { title: 'quirk', href: '/quirk', body: 'a short oddity with a colour. an optional local file lands in the share table. discord unfurls /quirk. large files are warned, never refused.' },
  { title: 'palimpsest', href: '/palimpsest', body: 'write over an earlier file. the later local file lands in the share table, the scrape note lands in palimpsests. /palimpsest/id is the discord card. large drops are warned, never refused. not a vault drawer. older desks stay.' },
  { title: 'underwriting', href: '/underwriting', body: 'the public index of later writings. open one to read what was scraped off and download the file. discord unfurls /underwriting. not a cabinet.' },
  { title: 'keystone', href: '/keystone', body: 'pin one local file to a place with a reading. bytes land in storage and the keystones table. /keystone/id is the discord card. large drops are warned, never refused. not a vault drawer. older desks stay.' },
  { title: 'voussoir', href: '/voussoir', body: 'the public arch of keystone pins. open one to read the place and the file. discord unfurls /voussoir. not a cabinet.' },
  { title: 'loft', href: '/loft', body: 'hang one local file in a room with a title and caption. bytes land in storage and the lofts table. /loft/id is the discord card. large drops are warned, never refused. not a vault drawer. older desks stay.' },
  { title: 'eaves', href: '/eaves', body: 'the public index of loft rooms already filed. open one to read the caption and the file. discord unfurls /eaves. not a cabinet.' },
  { title: 'haversack', href: '/haversack', body: 'send one local file with an errand. the row lands in the couriers table, and smaller files keep a byte copy in Postgres. /haversack/id is the discord card. large drops are warned, never refused. not a vault drawer. the satchel and courier desks stay.' },
  { title: 'pegboard', href: '/pegboard', body: 'the public board of haversacks already sent. open one to download, or mark it picked up. discord unfurls /pegboard. not a cabinet.' },
  { title: 'stub', href: '/stub', body: 'tear a counterfoil for someone. an optional local file lands in storage and the share table, the label lands in stubs. /stub/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'waybill', href: '/waybill', body: 'a delivery slip with stamped stops and an optional local file. bytes land in storage and the waybills table. /waybill/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'porter', href: '/porter', body: 'the public index of waybills. open one to stamp a stop or download the file. discord unfurls /porter. not a cabinet.' },
  { title: 'beading', href: '/beading', body: 'set one local file into a named room panel. bytes land in storage, the row lands in beading_panels and the share table. /beading/id is the discord card. large drops are warned, never refused. not a vault drawer. the older wainscot desk stays.' },
  { title: 'skirting', href: '/skirting', body: 'the public index of beading panels already filed. open one to download the file from the database. discord unfurls /skirting. not a vault drawer.' },
  { title: 'weatherboard', href: '/weatherboard', body: 'pin a notice with no file. the line lands in weatherboard_notes and /weatherboard/id unfurls in discord. older desks stay.' },
  { title: 'knocker', href: '/knocker', body: 'leave one local file at the door with a calling note. bytes land in storage, the row lands in knockers. /knocker/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'commonplace', href: '/commonplace', body: 'keep a sentence in the commonplace table. no file. /commonplace/id unfurls the line in discord. older desks stay.' },
  { title: 'transom', href: '/transom', body: 'open a receiving window. other people drop a local file into it. bytes land in storage, the slip lands in the database. /transom/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'casement', href: '/casement', body: 'the index of open windows. no file lives on this page. paste /casement in discord for the card. older desks stay.' },
  { title: 'ledger', href: '/ledger/house', body: 'a running book of lines, with an optional amount. no file. /ledger/house unfurls the latest line in discord. not a file vault.' },
  { title: 'fieldbook', href: '/fieldbook', body: 'a page of notes in the fieldbook table. no file. /fieldbook/id is the discord card. older desks stay.' },
  { title: 'stile', href: '/stile', body: 'a short link to any http address. the row lives in relays, not the vault. /stile/id unfurls in discord, then opens the address. causeway still files a local file.' },
  { title: 'inlay', href: '/inlay', body: 'stamp one local file into the pressmarks table. the bytes live in postgres, and /inlay/id is the discord card. large files are warned, never refused. not a vault drawer.' },
  { title: 'rack', href: '/rack', body: 'a public index of inlays already filed. open one to download the file from the database. discord unfurls /rack. not a vault drawer.' },
  { title: 'parcel', href: '/parcel', body: 'address one local file to a person, with a return note. bytes land in storage and a row in the share table. /parcel/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'colophon', href: '/colophon', body: 'credits beside a local file: title, edition, imprint. bytes land in storage and a row in the share table. /colophon/id is the discord card. large drops are warned, never refused. not a vault drawer.' },
  { title: 'haversack drops', href: '/haversack', body: 'file a local file into the drops bucket and the hosted_files table. Discord unfurls /haversack and /s. large drops are warned, never refused.' },
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
  { title: 'pressmark', href: '/pressmark', body: 'paint a 1200x630 cover in the tab and file the png so Discord has a real image. not a vault drawer.' },
  { title: 'trundle', href: '/trundle', body: 'a handoff slip for someone else. the local file lands in the share table. discord unfurls /trundle.' },
  { title: 'coping', href: '/coping', body: 'a checklist beside an optional local file. discord unfurls /coping. older desks stay.' },
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
            <motion.a key={item.href + '-' + item.title} href={item.href} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 12) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-6 hover:-translate-y-0.5 transition-transform duration-200">
              <h3 className="text-white font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
