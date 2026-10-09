import atelier from '../lib/endpoints/atelier.js';
import beacon from '../lib/endpoints/beacon.js';
import card from '../lib/endpoints/card.js';
import cardfront from '../lib/endpoints/cardfront.js';
import catfall from '../lib/endpoints/catfall.js';
import cathead from '../lib/endpoints/cathead.js';
import chock from '../lib/endpoints/chock.js';
import crosstree from '../lib/endpoints/crosstree.js';
import desk from '../lib/endpoints/desk.js';
import embed from '../lib/endpoints/embed.js';
import ferry from '../lib/endpoints/ferry.js';
import forefoot from '../lib/endpoints/forefoot.js';
import jackstay from '../lib/endpoints/jackstay.js';
import ketch from '../lib/endpoints/ketch.js';
import luff from '../lib/endpoints/luff.js';
import docket from '../lib/endpoints/docket.js';
import quire from '../lib/endpoints/quire.js';
import nightglass from '../lib/endpoints/nightglass.js';
import quarter from '../lib/endpoints/quarter.js';
import quay from '../lib/endpoints/quay.js';
import ribbon from '../lib/endpoints/ribbon.js';
import scuttle from '../lib/endpoints/scuttle.js';
import selvage from '../lib/endpoints/selvage.js';
import share from '../lib/endpoints/share.js';
import signal from '../lib/endpoints/signal.js';
import stay from '../lib/endpoints/stay.js';
import tide from '../lib/endpoints/tide.js';
import tiller from '../lib/endpoints/tiller.js';
import vesper from '../lib/endpoints/vesper.js';
import wall from '../lib/endpoints/wall.js';
import spunyarn from '../lib/endpoints/spunyarn.js';
import shelf from './shelf.js';
import handoff from '../lib/endpoints/handoff.js';
import wick from '../lib/endpoints/wick.js';
import slip from '../lib/endpoints/slip.js';
import cask from '../lib/endpoints/cask.js';
import tender from '../lib/endpoints/tender.js';
import holdfast from '../lib/endpoints/holdfast.js';
import deadlight from '../lib/endpoints/deadlight.js';
import wayleave from '../lib/endpoints/wayleave.js';
import quoin from '../lib/endpoints/quoin.js';
import newel from '../lib/endpoints/newel.js';
import latch from '../lib/endpoints/latch.js';
import grommet from '../lib/endpoints/grommet.js';
import splice from '../lib/endpoints/splice.js';
import vellum from '../lib/endpoints/vellum.js';
import thimble from '../lib/endpoints/thimble.js';
import sheave from '../lib/endpoints/sheave.js';
import leechoth from '../lib/endpoints/leecloth.js';
import oakdesk from '../lib/endpoints/oakdesk.js';
import daybook from '../lib/endpoints/daybook.js';
import pinboard from '../lib/endpoints/pinboard.js';
import fathom from '../lib/endpoints/fathom.js';
import sconce from '../lib/endpoints/sconce.js';
import watchglass from '../lib/endpoints/watchglass.js';
import logline from '../lib/endpoints/logline.js';
import lodestone from '../lib/endpoints/lodestone.js';
import inkstand from '../lib/endpoints/inkstand.js';
import windlass from '../lib/endpoints/windlass.js';
import outbox from '../lib/endpoints/outbox.js';
import hamper from '../lib/endpoints/hamper.js';
import sideboard from '../lib/endpoints/sideboard.js';
import billet from '../lib/endpoints/billet.js';
import porch from '../lib/endpoints/porch.js';
import hearth from '../lib/endpoints/hearth.js';
import apron from '../lib/endpoints/apron.js';
import mantel from '../lib/endpoints/mantel.js';
import flyleaf from '../lib/endpoints/flyleaf.js';
import endpaper from '../lib/endpoints/endpaper.js';
import parcel from '../lib/endpoints/parcel.js';
import dossier from '../lib/endpoints/dossier.js';
import pressmark from '../lib/endpoints/pressmark.js';
import colophon from '../lib/endpoints/colophon.js';
import seal from '../lib/endpoints/seal.js';
import handover from '../lib/endpoints/handover.js';
import transom from '../lib/endpoints/transom.js';
import ledger from '../lib/endpoints/ledger.js';
import knocker from '../lib/endpoints/knocker.js';
import commonplace from '../lib/endpoints/commonplace.js';
import wicket from '../lib/endpoints/wicket.js';
import letterpress from '../lib/endpoints/letterpress.js';
import lantern from '../lib/endpoints/lantern.js';
import beading from '../lib/endpoints/beading.js';
import weatherboard from '../lib/endpoints/weatherboard.js';
import listening from '../lib/endpoints/listening.js';
import waybill from '../lib/endpoints/waybill.js';
import stub from '../lib/endpoints/stub.js';
import passbook from '../lib/endpoints/passbook.js';
import haversack from '../lib/endpoints/haversack.js';
import loft from '../lib/endpoints/loft.js';
import keep from '../lib/endpoints/keep.js';
import keystone from '../lib/endpoints/keystone.js';
import clip from '../lib/endpoints/clip.js';
import palimpsest from '../lib/endpoints/palimpsest.js';
import quittance from '../lib/endpoints/quittance.js';
import spandrel from '../lib/endpoints/spandrel.js';
import stringcourse from '../lib/endpoints/stringcourse.js';
import plinth from '../lib/endpoints/plinth.js';
import architrave from '../lib/endpoints/architrave.js';
import scantling from '../lib/endpoints/scantling.js';
import margent from '../lib/endpoints/margent.js';
import oriel from '../lib/endpoints/oriel.js';
import quillon from '../lib/endpoints/quillon.js';
import soffit from '../lib/endpoints/soffit.js';
import volute from '../lib/endpoints/volute.js';
import courier from '../lib/endpoints/courier.js';
import tally from '../lib/endpoints/tally.js';
import reticule from '../lib/endpoints/reticule.js';
import lorgnette from '../lib/endpoints/lorgnette.js';

const routes = {
  atelier, beacon, card, cardfront, catfall, cathead, chock, crosstree, desk, embed, ferry, forefoot,
  docket, jackstay, ketch, luff, nightglass, quarter, quay, scuttle, selvage, quire, share, signal, stay, tide,
  tiller, vesper, wall, ribbon, loom: ribbon,
  spunyarn, eyelet: spunyarn,
  shelf, board: shelf, receipt: shelf, satchel: shelf,
  ashlar: shelf, tympanum: shelf, nosing: shelf,
  sill: shelf, keepsake: shelf, lintel: shelf,
  trundle: shelf, coping: shelf, springline: shelf,
  handoff, proof: handoff, quiet: handoff,
  wick,
  slip,
  cask,
  stave: cask,
  tender,
  gangway: tender,
  holdfast,
  clew: holdfast,
  deadlight,
  beeswax: deadlight,
  wayleave,
  quoin,
  rebate: quoin,
  newel,
  latch,
  hasp: latch,
  grommet,
  ring: grommet,
  splice,
  serving: splice,
  vellum,
  vellumboard: vellum,
  thimble,
  thimbles: thimble,
  sheave,
  coak: sheave,
  sheaveboard: sheave,
  leechoth,
  leecloth: leechoth,
  crossjack: leechoth,
  oakdesk,
  daybook,
  pinboard,
  fathom,
  sconce,
  watchglass,
  sandglass: watchglass,
  logline,
  chipboard: logline,
  lodestone,
  mariner: lodestone,
  inkstand,
  waypost: inkstand,
  windlass,
  outbox,
  postbag: outbox,
  hamper,
  marginalia: hamper,
  sideboard,
  linseed: sideboard,
  billet,
  ack: billet,
  porch,
  hearth,
  apron,
  mantel,
  flyleaf,
  endpaper,
  parcel,
  dossier,
  inlay: pressmark,
  rack: pressmark,
  colophon,
  folio: cardfront,
  swatch: cardfront,
  margin: cardfront,
  seal,
  handover,
  transom,
  casement: transom,
  ledger,
  knocker,
  commonplace,
  wicket,
  letterpress,
  lantern,
  readingroom: lantern,
  beading,
  skirting: beading,
  weatherboard,
  listening,
  setlist: listening,
  waybill,
  porter: waybill,
  stub,
  counterfoil: stub,
  passbook,
  haversack,
  pegboard: haversack,
  loft,
  eaves: loft,
  keep,
  studio: keep,
  keystone,
  voussoir: keystone,
  clip,
  rail: clip,
  palimpsest,
  underwriting: palimpsest,
  quittance,
  acquittance: quittance,
  pressmark,
  spandrel,
  stringcourse,
  beltcourse: stringcourse,
  plinth,
  inlet: plinth,
  architrave,
  taenia: architrave,
  scantling,
  margent,
  oriel,
  quillon,
  soffit,
  volute,
  courier,
  tally,
  reticule,
  drawstring: reticule,
  lorgnette,
  monocle: lorgnette,
  gallipot: shelf,
  catchword: shelf,
  bookplate: shelf,
};

export default function handler(req, res) {
  const fromQuery = (req.query && req.query.name) || '';
  const path = (req.url || '').split('?')[0];
  const fromPath = path.split('/').filter(Boolean).pop() || '';
  const name = String(fromQuery || fromPath || 'desk').toLowerCase();
  const fn = routes[name] || desk;
  return fn(req, res);
}
