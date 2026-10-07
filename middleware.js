const BOT = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|applebot|iframely|unfurl|pinterest|embedly|skype|slack-imgproxy|preview|bot|crawler|spider/i;

export const config = {
  matcher: ['/((?!api/|assets/|og\\.png|favicon|robots).*)'],
};

function card(request, page, id) {
  const url = new URL(request.url);
  const dest = new URL('/api/gate', request.url);
  dest.searchParams.set('name', 'cardfront');
  dest.searchParams.set('page', page);
  if (id) dest.searchParams.set('id', id);
  const ua = request.headers.get('user-agent') || '';
  return fetch(dest.toString(), {
    headers: {
      'user-agent': ua,
      'x-forwarded-host': url.host,
      'x-forwarded-proto': url.protocol.replace(':', ''),
    },
  });
}

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT.test(ua)) return;
  const url = new URL(request.url);
  if (url.searchParams.get('embed') === '0') return;
  const parts = url.pathname.split('/').filter(Boolean);
  if (!parts.length) return card(request, 'home', '');
  return card(request, parts[0].toLowerCase(), parts[1] ? decodeURIComponent(parts[1]) : '');
}
