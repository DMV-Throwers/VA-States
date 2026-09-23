import { NextRequest, NextResponse } from 'next/server';

/**
 * Short public link for the spectator survey: register.dmvthrowers.club/feedback
 * Easy to say out loud, post, or put on a QR code for walk-ups who never
 * RSVP'd. Tags responses as source=live unless the link already carries a
 * ?src= (e.g. /feedback?src=qr).
 */
export function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  const src = url.searchParams.get('src') ?? 'live';
  url.pathname = '/survey/spectator';
  url.search = `?src=${encodeURIComponent(src)}`;
  return NextResponse.redirect(url, 307);
}
