export const config = {
  matcher: ['/((?!api/|assets/|src/|favicon.ico|og.png|.*\\..*).*)'],
};

const BOT = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|skype|redditbot|applebot|iframely|unfurl|pinterest|notion|embedly|slack-imgproxy|discordbot/i;
const ID_PREFIX = new Set(['s', 'f', 'x', 'd', 'go', 'open', 'link', 'card', 'embed', 'y', 'q', 'l', 'n', 'k', 'w', 'u', 'r', 'b', 'g', 'c', 'm', 'o', 't', 'i', 'a', 'e', 'z', 'h', 'v', 'j', 'p', 'room', 'parcel', 'spirket', 'washboard', 'beakhead', 'partners', 'waybill', 'fid', 'pelorus', 'cuddy', 'hawse', 'futtock', 'samson', 'gudgeon', 'pintle', 'sternpost', 'breasthook', 'capstan', 'treenail', 'fairlead', 'hounds', 'seizing', 'deadeye', 'sounding', 'marline', 'orlop', 'cleat', 'passage', 'lantern']);

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'spirket' || parts[0] === 'spirketing') {
    const dest = new URL('/api/spirket', request.url);
    if (parts[0] === 'spirket' && parts[1]) dest.searchParams.set('id', decodeURIComponent(parts[1]));
    else dest.searchParams.set('page', 'spirketing');
    return Response.redirect(dest.toString(), 307);
  }
  if ((parts[0] === 'breastwork' || parts[0] === 'scantling') && BOT.test(ua)) {
    const dest = new URL('/api/paircard', request.url);
    if (parts[1]) dest.searchParams.set(parts[0], decodeURIComponent(parts[1]));
    else dest.searchParams.set('page', parts[0]);
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'bobstay' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'bobstay');
    if (parts[1]) dest.searchParams.set('ask', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'keelson' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'keelson');
    if (parts[1]) dest.searchParams.set('receipt', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'fairlead' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'fairlead');
    if (parts[1]) dest.searchParams.set('check', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'hounds' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'hounds');
    if (parts[1]) dest.searchParams.set('id', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'deadeye' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'deadeye');
    if (parts[1]) dest.searchParams.set('id', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'sounding' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'sounding');
    if (parts[1]) dest.searchParams.set('id', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'marline' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'marline');
    if (parts[1]) dest.searchParams.set('id', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'orlop' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'orlop');
    if (parts[1]) dest.searchParams.set('id', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'passage' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'passage');
    if (parts[1]) dest.searchParams.set('id', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'lantern' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'lantern');
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'cleat' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'cleat');
    return Response.redirect(dest.toString(), 307);
  }
  if (parts[0] === 'seizing' && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', 'seizing');
    return Response.redirect(dest.toString(), 307);
  }
  if ((parts[0] === 'capstan' || parts[0] === 'treenail') && BOT.test(ua)) {
    const dest = new URL('/api/embed', request.url);
    dest.searchParams.set('page', parts[0]);
    if (parts[1]) dest.searchParams.set('pin', decodeURIComponent(parts[1]));
    return Response.redirect(dest.toString(), 307);
  }
  if (!BOT.test(ua)) return;
  const dest = new URL('/api/embed', request.url);
  if (!parts.length) dest.searchParams.set('page', 'home');
  else if (parts[0] === 'parcel' && parts[1]) dest.searchParams.set('parcel', decodeURIComponent(parts[1]));
  else if (parts[0] === 'room' && parts[1]) dest.searchParams.set('room', decodeURIComponent(parts[1]));
  else if (parts[0] === 'partners' && parts[1]) dest.searchParams.set('page', 'partners');
  else if (parts[0] === 'waybill') dest.searchParams.set('page', 'waybill');
  else if (parts[0] === 'telltale') dest.searchParams.set('page', 'telltale');
  else if (parts[0] === 'garboard') dest.searchParams.set('page', 'garboard');
  else if (parts[0] === 'sounding' && !parts[1]) dest.searchParams.set('page', 'sounding');
  else if (parts[0] === 'marline' && !parts[1]) dest.searchParams.set('page', 'marline');
  else if (parts[0] === 'hawse' && !parts[1]) dest.searchParams.set('page', 'hawse');
  else if (parts[0] === 'futtock' && !parts[1]) dest.searchParams.set('page', 'futtock');
  else if (parts[0] === 'samson' && !parts[1]) dest.searchParams.set('page', 'samson');
  else if (parts[0] === 'gudgeon' && !parts[1]) dest.searchParams.set('page', 'gudgeon');
  else if (parts[0] === 'pintle' && !parts[1]) dest.searchParams.set('page', 'pintle');
  else if (parts[0] === 'sternpost' && !parts[1]) dest.searchParams.set('page', 'sternpost');
  else if (parts[0] === 'breasthook' && !parts[1]) dest.searchParams.set('page', 'breasthook');
  else if (parts[0] === 'treenail' && !parts[1]) dest.searchParams.set('page', 'treenail');
  else if (parts[0] === 'fairlead' && !parts[1]) dest.searchParams.set('page', 'fairlead');
  else if (parts[0] === 'deadeye' && !parts[1]) dest.searchParams.set('page', 'deadeye');
  else if (parts[0] === 'passage' && !parts[1]) dest.searchParams.set('page', 'passage');
  else if (parts[0] === 'lantern') dest.searchParams.set('page', 'lantern');
  else if (parts.length >= 2 && ID_PREFIX.has(parts[0])) dest.searchParams.set('id', decodeURIComponent(parts[1]));
  else dest.searchParams.set('page', decodeURIComponent(parts[0]).toLowerCase());
  return Response.redirect(dest.toString(), 307);
}
