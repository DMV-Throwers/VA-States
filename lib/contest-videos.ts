import type { Division } from '@/lib/standings';

/** Official VSYC-26 contest videos, posted to YouTube after the event. */
export const WINNERS_PLAYLIST_URL =
  'https://www.youtube.com/watch?v=HR3JGZqPU1A&list=PLTe9veZWEAjw';

export const DIVISION_PLAYLIST_URLS: Record<Division, string> = {
  '1A':  'https://www.youtube.com/playlist?list=PLXWgXdP6WcDk',
  'X':   'https://www.youtube.com/playlist?list=PLL-WART552LE',
  'SBJ': 'https://www.youtube.com/playlist?list=PLJ4rR3cEuzxs',
};

export const LIVESTREAM_URL = 'https://www.youtube.com/live/yVLew1sJqNA';
