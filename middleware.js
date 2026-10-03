export const config = {
  matcher: ['/((?!api/|assets/|src/|favicon.ico|og.png|.*\\..*).*)'],
};

const BOT = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|skype|redditbot|applebot|iframely|unfurl|pinterest|notion|embedly|slack-imgproxy|discordbot/i;
const ID_PREFIX = new Set(['s', 'f', 'x', 'd', 'go', 'open', 'link', 'card', 'embed', 'y', 'q', 'l', 'n', 'k', 'w', 'u', 'r', 'b', 'g', 'c', 'm', 'o', 't', 'i', 'a', 'e', 'z', 'h', 'v', 'j', 'p', 'room', 'parcel', 'spirket', 'washboard', 'beakhead', 'garland', 'partners']);

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
  if (!BOT.test(ua)) return;
  const dest = new URL('/api/embed', request.url);
  if (!parts.length) dest.searchParams.set('page', 'home');
  else if (parts[0] === 'parcel' && parts[1]) dest.searchParams.set('parcel', decodeURIComponent(parts[1]));
  else if (parts[0] === 'room' && parts[1]) dest.searchParams.set('room', decodeURIComponent(parts[1]));
  else if (parts[0] === 'partners' && parts[1]) dest.searchParams.set('page', 'partners');
  else if (parts.length >= 2 && ID_PREFIX.has(parts[0])) dest.searchParams.set('id', decodeURIComponent(parts[1]));
  else dest.searchParams.set('page', decodeURIComponent(parts[0]).toLowerCase());
  return Response.redirect(dest.toString(), 307);
}
