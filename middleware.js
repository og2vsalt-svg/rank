export const config = {
  matcher: ['/((?!api/|assets/|src/|favicon.ico|og.png|.*\\..*).*)'],
};

const BOT = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|skype|redditbot|applebot|iframely|unfurl|pinterest|notion|embedly|slack-imgproxy|discordbot/i;
const ID_PREFIX = new Set(['scuttle', 'wale', 'flemish', 'knee', 'transom', 'belaying', 'loft', 'quay', 's', 'f', 'x', 'd', 'go', 'open', 'link', 'card', 'embed', 'y', 'q', 'l', 'n', 'k', 'w', 'u', 'r', 'b', 'g', 'c', 'm', 'o', 't', 'i', 'a', 'e', 'z', 'h', 'v', 'j', 'p', 'room', 'parcel', 'spirket', 'catfall', 'washboard', 'beakhead', 'partners', 'waybill', 'fid', 'pelorus', 'cuddy', 'hawse', 'futtock', 'stringer', 'samson', 'gudgeon', 'pintle', 'sternpost', 'breasthook', 'capstan', 'treenail', 'fairlead', 'hounds', 'seizing', 'deadeye', 'sounding', 'marline', 'orlop', 'cleat', 'passage', 'lantern', 'forepeak', 'lazarette', 'skylight', 'limber', 'bitt', 'taffrail', 'counter', 'scupper', 'rider', 'gunwale', 'bumkin', 'apostle', 'tumblehome', 'sheerstrake', 'washstrake', 'waterway', 'bulwark', 'coaming', 'carvel', 'bearding', 'rowlock', 'margin', 'thwart', 'kevel', 'stemson', 'lodging', 'oakum', 'painter', 'rabbet', 'floors', 'chestree', 'kedge', 'binnacle', 'davits', 'hawser', 'gammon', 'cathead', 'wharf', 'lashing', 'blotter', 'billboard', 'companion', 'bowsprit', 'chainplate', 'bollard', 'unfurl', 'forefoot', 'swifter', 'chock', 'mizzen', 'kelson', 'garboard', 'channels', 'selvage', 'vesper', 'luff', 'ketch', 'beacon', 'quarter', 'bilge', 'atelier', 'ledger', 'fiferail', 'gantline', 'tiller', 'crosstree', 'jackstay']);

const DEDICATED = {
  scuttle: '/api/scuttle',
  atelier: '/api/atelier',
  fiferail: '/api/embed',
  gantline: '/api/embed',
  tiller: '/api/embed',
  crosstree: '/api/crosstree',
  jackstay: '/api/jackstay',
  hawsepipe: '/api/embed',
  stemhead: '/api/embed',
  counterrail: '/api/embed',
  quayfile: '/api/quay',
  ledger: '/api/atelier',
  nightglass: '/api/nightglass',
  pintle: '/api/embed',
  rowlock: '/api/embed',
  gunwale: '/api/embed',
  carvel: '/api/embed',
  bearding: '/api/embed',
  thwart: '/api/embed',
  kevel: '/api/embed',
  stemson: '/api/embed',
  lodging: '/api/embed',
  oakum: '/api/embed',
  painter: '/api/embed',
  rabbet: '/api/embed',
  floors: '/api/embed',
  chestree: '/api/embed',
  davits: '/api/embed',
  blotter: '/api/wall',
  billboard: '/api/wall',
  companion: '/api/wall',
  hawser: '/api/embed',
  wale: '/api/embed',
  flemish: '/api/embed',
  wharf: '/api/tide',
  lashing: '/api/tide',
  gammon: '/api/card',
  cathead: '/api/card',
  catfall: '/api/catfall',
  spirket: '/api/catfall',
  bowsprit: '/api/stay',
  chainplate: '/api/stay',
  s: '/api/card',
  f: '/api/card',
  open: '/api/card',
  go: '/api/card',
  link: '/api/card',
  card: '/api/card',
  bollard: '/api/embed',
  unfurl: '/api/embed',
  forefoot: '/api/forefoot',
  swifter: '/api/forefoot',
  chock: '/api/chock',
  mizzen: '/api/chock',
  kelson: '/api/chock',
  garboard: '/api/desk',
  channels: '/api/desk',
  selvage: '/api/selvage',
  vesper: '/api/vesper',
  luff: '/api/signal',
  ketch: '/api/signal',
  beacon: '/api/signal',
  quarter: '/api/quarter',
  bilge: '/api/quarter',
};

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT.test(ua)) return;
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const head = parts[0] || '';
  if (DEDICATED[head]) {
    const dest = new URL(DEDICATED[head], request.url);
    dest.searchParams.set('page', head);
    if (parts[1]) dest.searchParams.set('id', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  const dest = new URL('/api/embed', request.url);
  if (!parts.length) dest.searchParams.set('page', 'home');
  else if (parts[0] === 'parcel' && parts[1]) dest.searchParams.set('parcel', decodeURIComponent(parts[1]));
  else if (parts[0] === 'room' && parts[1]) dest.searchParams.set('room', decodeURIComponent(parts[1]));
  else if (parts.length >= 2 && (ID_PREFIX.has(parts[0]) || /^[a-z][a-z0-9-]{1,40}$/.test(parts[0]))) {
    dest.searchParams.set('page', parts[0]);
    dest.searchParams.set('id', decodeURIComponent(parts[1]));
  } else dest.searchParams.set('page', decodeURIComponent(parts[0] || 'home').toLowerCase());
  return Response.redirect(dest.toString(), 307);
}
