/**
 * VSYC-26 post-event feedback surveys — single source of truth shared by:
 *  - the unlisted survey pages (app/survey/[type]/page.tsx)
 *  - server-side validation (app/api/survey/route.ts)
 *  - the admin Surveys tab (components/SurveyResults.tsx)
 *
 * Every respondent type gets the SAME shared blocks (contest, weekend spend,
 * Goodles, stay in touch) so results can be compared across groups and the
 * economic-impact numbers cover everyone who was there. Only the opening
 * "Your day" block changes per role — plus a Prizes block for winners
 * (top 3 per division), sales questions for vendors, and a livestream path
 * for spectators who watched online (they skip the in-person questions).
 *
 * Question `key`s are stored as JSON keys in vsyc26_survey_responses.answers.
 * Never rename a key once responses exist — add a new one instead.
 */

import { VOLUNTEER_ROLES } from './volunteer-roles';

export const SURVEY_TYPES = ['competitor', 'winner', 'spectator', 'volunteer', 'vendor', 'sponsor'] as const;
export type SurveyType = (typeof SURVEY_TYPES)[number];

export function isSurveyType(value: string): value is SurveyType {
  return (SURVEY_TYPES as readonly string[]).includes(value);
}

/** Where the respondent came from — set by ?src= on the link. */
export const SURVEY_SOURCES = ['email', 'live', 'qr', 'social', 'direct'] as const;
export type SurveySource = (typeof SURVEY_SOURCES)[number];

export type QuestionKind = 'single' | 'multi' | 'scale5' | 'nps' | 'text' | 'short';

export interface SurveyQuestion {
  key: string;
  kind: QuestionKind;
  label: string;
  hint?: string;
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
  /** Only shown (and only accepted) when another answer matches (or, for a multi, includes) one of these values. */
  showIf?: Condition;
  /** Hidden when another answer matches. Unlike showIf, a missing answer keeps it visible —
   *  so shared questions can hide for one survey's path without disappearing from the others. */
  hideIf?: Condition;
  /** Ends of a scale, shown under the buttons. */
  scaleLabels?: [string, string];
  /** Numeric midpoint per option (dollars or hours), used by the dashboard to estimate totals. */
  midpoints?: Record<string, number>;
  maxLength?: number;
}

export interface Condition {
  key: string;
  anyOf: readonly string[];
}

export interface SurveySection {
  id: string;
  title: string;
  blurb?: string;
  questions: SurveyQuestion[];
  showIf?: Condition;
  hideIf?: Condition;
}

export interface SurveyDef {
  type: SurveyType;
  eyebrow: string;
  title: string;
  intro: string;
  sections: SurveySection[];
}

// ─── Shared option sets ──────────────────────────────────────────────────────

const RATING_LABELS: [string, string] = ['1 · Rough', '5 · Excellent'];

const TRAVEL = ['Under 1 hour', '1–2 hours', '2–4 hours', '4+ hours', 'Flew in'] as const;
const GROUP_SIZE = ['Just me', '2', '3–4', '5+'] as const;
const HOTEL_NIGHTS = ['0 · Day trip', '1 night', '2 nights', '3+ nights'] as const;
const GROUP_RATE = ['Knew about it and used it', "Knew about it, didn't use it", "Didn't know there was one"] as const;
const STAYED_OVER: Condition = { key: 'hotel_nights', anyOf: ['1 night', '2 nights', '3+ nights'] };

const WEEKEND_SPEND = ['Under $50', '$50–100', '$100–250', '$250–500', '$500+'] as const;
const WEEKEND_SPEND_MID: Record<string, number> = {
  'Under $50': 25, '$50–100': 75, '$100–250': 175, '$250–500': 375, '$500+': 600,
};

const DULLES_SPEND = ['$0', '$1–25', '$25–75', '$75–150', '$150+'] as const;
const DULLES_SPEND_MID: Record<string, number> = {
  '$0': 0, '$1–25': 13, '$25–75': 50, '$75–150': 113, '$150+': 175,
};

const VENDOR_SPEND = ['$1–25', '$25–75', '$75–150', '$150+'] as const;
const VENDOR_VISIT = ['Stopped and bought something', "Stopped but didn't buy", "Didn't stop at a vendor"] as const;
// Who actually tabled and sold product on the day (confirmed after the event —
// the site's "Who's Tabling" list was longer than who showed up).
// Recess and Jake Bullock shared one booth: one option for shoppers, separate
// options for the vendors themselves so each can answer. Bmore YoYo Club sold
// the VSYC-26 contest merch alongside their own club merch.
const VENDORS = [
  'Freshly Dirty',
  'Recess & Jake Bullock (shared booth)',
  'Slow & Steady Bikes and Goods',
  'Bmore YoYo Club (contest + club merch, nail painting)',
] as const;
const VENDOR_RESPONDENTS = ['Freshly Dirty', 'Recess', 'Jake Bullock', 'Slow & Steady Bikes and Goods', 'Bmore YoYo Club'] as const;

const AFTER_PARTY = ["Didn't know about it", "Didn't go", 'Went · spent $0', 'Went · $1–20', 'Went · $20–50', 'Went · $50+'] as const;
const AFTER_PARTY_MID: Record<string, number> = {
  "Didn't know about it": 0, "Didn't go": 0, 'Went · spent $0': 0, 'Went · $1–20': 10, 'Went · $20–50': 35, 'Went · $50+': 60,
};

const AMENITIES = [
  'Parking',
  'Food court / restaurants',
  'Restrooms',
  'Seating / eating areas',
  'Charging outlets',
  'Mall Wi-Fi',
  'Hotel shuttle / lobby',
] as const;

const GROUP_AGES = ['Kids under 12', 'Teens 13–17', 'Adults 18+'] as const;

// Goodles
const GOODLES_FAMILIARITY = [
  'Never heard of it',
  "Heard of it, hadn't tried it",
  'Tried it before',
  'Buy it regularly',
] as const;
const GOODLES_BOOTH = ['Stopped by', "Saw it, didn't stop", "Didn't notice it"] as const;
// What the Goodles giveaway booth actually did on the day: postcards to get a
// shirt + Mac mailed out, stickers and temporary tattoos. (No Twirl for a Prize, no sampling.)
const GOODLES_ACTIVITIES = [
  'Filled out a postcard for a free shirt + Mac',
  'Got stickers or temporary tattoos',
  'Took a photo',
  'Talked with the Goodles team',
  'Followed Goodles on social',
] as const;
const GOODLES_INTENT = ['Much more likely', 'A bit more likely', 'No change', 'Less likely'] as const;
const GOODLES_AFFINITY = [
  'A lot more',
  'A little more',
  'No difference',
  'Less',
] as const;

// Spectator path: people who only watched the YoYo Contest Central livestream
// skip everything that assumes they were at the mall.
const WATCH_MODES = ['In person at Dulles Town Center', 'On the livestream only', 'Both'] as const;
const STREAM_ONLY: Condition = { key: 'watch_mode', anyOf: ['On the livestream only'] };
const WATCHED_STREAM: Condition = { key: 'watch_mode', anyOf: ['On the livestream only', 'Both'] };

// ─── Shared sections ────────────────────────────────────────────────────────

function contestSection(): SurveySection {
  return {
    id: 'contest',
    title: 'The Contest',
    blurb: 'Big picture. Be honest. It only helps.',
    questions: [
      { key: 'overall_rating', kind: 'scale5', label: 'Overall, how was VSYC-26?', required: true, scaleLabels: RATING_LABELS },
      { key: 'venue_rating', kind: 'scale5', label: 'How was Dulles Town Center as the venue?', hint: 'Space, sound, sightlines, getting around', scaleLabels: RATING_LABELS, hideIf: STREAM_ONLY },
      { key: 'did_well', kind: 'text', label: 'What\u2019s the one thing we should keep for VSYC-27, no matter what?', maxLength: 1500 },
      { key: 'do_better', kind: 'text', label: 'What\u2019s one thing that didn\u2019t work or frustrated you?', maxLength: 1500 },
      {
        key: 'next_year_suggestions', kind: 'text', label: 'Any suggestions or ideas for VSYC-27?',
        hint: 'New divisions, activities, prizes, timing, food, anything', maxLength: 2000,
      },
      {
        key: 'recommend_nps', kind: 'nps', required: true,
        label: 'How likely are you to recommend VSYC to a friend or family member?',
        scaleLabels: ['0 · Not at all', '10 · Absolutely'],
      },
    ],
  };
}

function weekendSection({ includeVendorSpend = true } = {}): SurveySection {
  const questions: SurveyQuestion[] = [
    { key: 'travel_time', kind: 'single', label: 'How long was your trip to the contest (one way)?', options: TRAVEL },
    { key: 'group_size', kind: 'single', label: 'Including you, how many people were in your group?', options: GROUP_SIZE },
    { key: 'group_ages', kind: 'multi', label: 'Who was in your group?', hint: 'Tap all that apply', options: GROUP_AGES },
    { key: 'hotel_nights', kind: 'single', label: 'How many nights did you stay overnight nearby?', options: HOTEL_NIGHTS },
    {
      key: 'hotel_where', kind: 'single', label: 'Where did you stay?',
      options: ['Courtyard by Marriott Dulles Town Center', 'Candlewood Suites Sterling', 'Another hotel', 'Airbnb / rental', 'Friends or family'],
      showIf: STAYED_OVER,
    },
    { key: 'hotel_group_rate', kind: 'single', label: 'VA States had a $125 room block at the Courtyard by Marriott Dulles Town Center. Did you know about it?', options: GROUP_RATE },
    {
      key: 'hotel_block_why_not', kind: 'single', label: 'What kept you from using the room block?',
      options: ['Booked too late (it closed Aug 29)', 'Found a better price', 'Wanted a different hotel', 'Stayed with friends or family', 'Didn\u2019t need a room', 'Other'],
      showIf: { key: 'hotel_group_rate', anyOf: ["Knew about it, didn't use it"] },
    },
    {
      key: 'hotel_block_rating', kind: 'scale5', label: 'How was your stay at the Courtyard?', hint: 'Booking, room, location, shuttle',
      scaleLabels: RATING_LABELS, showIf: { key: 'hotel_group_rate', anyOf: ['Knew about it and used it'] },
    },
    {
      key: 'hotel_block_next', kind: 'single', label: 'Would you use a room block again next year?',
      options: ['Yes, same hotel', 'Yes, but a cheaper option', 'Maybe', 'No'], showIf: STAYED_OVER,
    },
    {
      key: 'weekend_spend', kind: 'single',
      label: 'About how much did your group spend on the trip?',
      hint: 'Gas, hotel, food, shopping. Leave out entry fees.',
      options: WEEKEND_SPEND, midpoints: WEEKEND_SPEND_MID,
    },
    {
      key: 'dulles_spend', kind: 'single',
      label: 'How much of that went to Dulles Town Center stores and restaurants?',
      options: DULLES_SPEND, midpoints: DULLES_SPEND_MID,
    },
    {
      key: 'dulles_incremental', kind: 'single',
      label: 'Would you have gone to Dulles Town Center that day without the contest?',
      hint: 'Tells the venue how many new visitors the contest brought in',
      options: ['No, I came for VSYC', 'Maybe', 'Yes, I would have been there anyway'],
    },
    { key: 'vendor_visit', kind: 'single', label: 'Did you stop at a yo-yo vendor table?', options: VENDOR_VISIT },
    {
      key: 'vendors_visited', kind: 'multi', label: 'Which vendors?', hint: 'Tap all that apply', options: VENDORS,
      showIf: { key: 'vendor_visit', anyOf: ['Stopped and bought something', "Stopped but didn't buy"] },
    },
    {
      key: 'vendor_spend', kind: 'single', label: 'About how much did you spend at vendor tables?',
      options: VENDOR_SPEND, midpoints: DULLES_SPEND_MID,
      showIf: { key: 'vendor_visit', anyOf: ['Stopped and bought something'] },
    },
    {
      key: 'merch_bought', kind: 'multi', label: 'Did you buy any of these?', hint: 'Contest merch money funds future contests',
      options: ['VSYC-26 contest merch (shirts, buttons, pronoun pins)', 'Bmore YoYo Club club merch', 'None of these'],
    },
    {
      key: 'miniso_store', kind: 'single', label: 'Did you visit the MINISO store in Dulles Town Center?',
      hint: 'MINISO sent their mascot to the contest',
      options: ['Yes, and bought something', 'Yes, just looked', 'No'],
    },
    { key: 'amenities_used', kind: 'multi', label: 'Which amenities did you use that day?', hint: 'Tap all that apply', options: AMENITIES },
    {
      key: 'after_party', kind: 'single',
      label: 'Did you go to the after-party at Lost Rhino Brewing? About how much did you spend?',
      options: AFTER_PARTY, midpoints: AFTER_PARTY_MID,
    },
  ];
  return {
    id: 'weekend',
    title: 'Your Trip',
    hideIf: STREAM_ONLY,
    blurb: 'Rough guesses are fine. This shows venues and partners the real impact of the contest.',
    // Vendors don't get asked about shopping at their own tables.
    questions: includeVendorSpend
      ? questions
      : questions.filter((q) => !['vendor_visit', 'vendors_visited', 'vendor_spend'].includes(q.key)),
  };
}

function goodlesSection(sponsorView = false): SurveySection {
  return {
    id: 'goodles',
    title: 'Goodles',
    blurb: sponsorView
      ? 'Goodles brought VSYC-26 to you. Goodles team: skip ahead to Stay in Touch.'
      : 'Goodles brought VSYC-26 to you. Tell us what you thought.',
    questions: [
      { key: 'goodles_familiarity', kind: 'single', label: 'Before VSYC-26, how well did you know Goodles?', options: GOODLES_FAMILIARITY, required: !sponsorView },
      {
        key: 'goodles_booth', kind: 'single', label: 'Did you stop by the Goodles giveaway booth?', hint: 'Postcards for a free shirt + Mac, stickers, temporary tattoos',
        options: GOODLES_BOOTH, required: !sponsorView, hideIf: STREAM_ONLY,
      },
      {
        key: 'goodles_stream_noticed', kind: 'single', label: 'Did you notice Goodles on the stream?',
        options: ['Yes', 'No', 'Not sure'], showIf: WATCHED_STREAM,
      },
      {
        key: 'goodles_activities', kind: 'multi', label: 'What did you do there?', hint: 'Tap all that apply',
        options: GOODLES_ACTIVITIES, showIf: { key: 'goodles_booth', anyOf: ['Stopped by'] },
      },
      {
        key: 'goodles_postcard_arrived', kind: 'single', label: 'Has your Goodles shirt and Mac arrived?',
        options: ['Yes', 'Not yet'], showIf: { key: 'goodles_activities', anyOf: ['Filled out a postcard for a free shirt + Mac'] },
      },
      {
        key: 'goodles_booth_rating', kind: 'scale5',
        label: sponsorView ? 'Rate the Goodles activation' : 'Rate the Goodles booth',
        scaleLabels: RATING_LABELS, showIf: { key: 'goodles_booth', anyOf: ['Stopped by'] },
      },
      {
        key: 'goodles_purchase_intent', kind: 'single', label: 'After VSYC-26, how likely are you to buy Goodles?',
        options: GOODLES_INTENT,
        // Regular buyers can't show lift; skip them so this measures new customers.
        showIf: { key: 'goodles_familiarity', anyOf: ['Never heard of it', "Heard of it, hadn't tried it", 'Tried it before'] },
      },
      {
        key: 'goodles_affinity', kind: 'single',
        label: 'Seeing Goodles back a yo-yo contest, do you think more or less of the brand?',
        options: GOODLES_AFFINITY,
      },
      {
        key: 'goodles_feedback', kind: 'text',
        label: sponsorView ? 'Any notes for Goodles as a fellow sponsor?' : 'Anything you want Goodles to hear?',
        hint: 'Favorite flavor, booth ideas, anything', maxLength: 1000,
      },
    ],
  };
}

const DUEL_COMPETED: Condition = { key: 'duel_competed', anyOf: ['Yes'] };
const DUEL_NOT_COMPETED: Condition = { key: 'duel_competed', anyOf: ['No'] };
const DUEL_WATCHED: Condition = { key: 'duel_watched', anyOf: ['Watched it in person', 'Watched it on the stream'] };
/** Competed, or watched — either way they saw it. */
const DUEL_SAW_IT: Condition = { key: 'duel_engaged', anyOf: ['yes'] };

/**
 * Stella Duellum: the Dueling Stars guest bracket run by Prismatic Stars.
 * Players get the player questions; everyone else is asked whether they
 * watched, and only watchers see the rest. Missed it = one or two taps.
 */
function duelSection(): SurveySection {
  return {
    id: 'duel',
    title: 'Stella Duellum',
    blurb: 'The Dueling Stars bracket at noon, hosted by Anneurismz for Prismatic Stars: one-minute routines, random music, chat-poll winners.',
    questions: [
      { key: 'duel_competed', kind: 'single', label: 'Did you compete in Stella Duellum?', options: ['Yes', 'No'], required: true },

      // Players
      { key: 'duel_player_rating', kind: 'scale5', label: 'How much did you enjoy competing in it?', scaleLabels: ['1 · Not for me', '5 · Loved it'], showIf: DUEL_COMPETED },
      { key: 'duel_rounds', kind: 'single', label: 'How far did you get?', options: ['Out in my first battle', 'Won at least one battle', 'Semifinal or final'], showIf: DUEL_COMPETED },
      {
        key: 'duel_format', kind: 'single', label: 'One-minute routines to random music, no repeated routines: keep that format?',
        options: ['Keep it exactly', 'Keep it, with tweaks', 'Change it up'], showIf: DUEL_COMPETED,
      },
      { key: 'duel_vote_fair', kind: 'scale5', label: 'Did the YouTube chat-poll voting feel fair?', scaleLabels: ['1 · Not at all', '5 · Totally fair'], showIf: DUEL_COMPETED },
      {
        key: 'duel_signup_when', kind: 'single', label: 'When did you sign up?',
        options: ['Ahead of time on Challonge', 'On the day'], showIf: DUEL_COMPETED,
      },
      { key: 'duel_signup', kind: 'scale5', label: 'How easy was signing up and knowing when you were up?', scaleLabels: RATING_LABELS, showIf: DUEL_COMPETED },
      { key: 'duel_play_again', kind: 'single', label: 'Would you play Stella Duellum again?', options: ['Yes', 'Maybe', 'No'], showIf: DUEL_COMPETED },

      // Everyone else
      {
        key: 'duel_watched', kind: 'single', label: 'Did you watch it?',
        options: ['Watched it in person', 'Watched it on the stream', 'Missed it', "Didn't know it was happening"], showIf: DUEL_NOT_COMPETED,
      },
      { key: 'duel_rating', kind: 'scale5', label: 'How fun was it to watch?', scaleLabels: ['1 · Not for me', '5 · Loved it'], showIf: DUEL_WATCHED },
      {
        key: 'duel_voted', kind: 'single', label: 'Did you vote in the YouTube chat poll?',
        options: ['Yes', "No, didn't know how", "No, wasn't on the stream"], showIf: DUEL_WATCHED,
      },

      // Anyone who played or watched
      {
        key: 'duel_next_year', kind: 'single', label: 'Should Stella Duellum come back for VSYC-27?',
        options: ['Yes, make it bigger', 'Yes, same size', 'Not sure', 'No'], showIf: DUEL_SAW_IT,
      },
      { key: 'prismatic_aware', kind: 'single', label: 'Before VSYC-26, had you heard of Prismatic Stars?', options: ['Yes', 'No'], showIf: DUEL_SAW_IT },
      { key: 'duel_feedback', kind: 'text', label: 'Anything for Prismatic Stars or Anneurismz?', maxLength: 1000, showIf: DUEL_SAW_IT },
    ],
  };
}

function stayInTouchSection(): SurveySection {
  return {
    id: 'contact',
    title: 'Stay in Touch',
    blurb: 'All optional.',
    questions: [
      { key: 'ig_handle', kind: 'short', label: 'Posted about VSYC-26? Drop your Instagram so we can share it', placeholder: '@yourhandle', maxLength: 60 },
      {
        key: 'keep_me_posted', kind: 'multi', label: 'Want to hear about any of these?',
        hint: 'Add your email in the next section',
        options: ['VSYC-27 dates and registration', 'Free DMV Throwers monthly meetups', 'Volunteering next year', 'Sponsoring or vending next year'],
      },
    ],
  };
}

// ─── Per-role opening blocks ────────────────────────────────────────────────

const TOOLS_USED = [
  'Live run order board',
  'Online results page',
  'YoYo Pro Clicker app (couch judging)',
  'None of these',
] as const;

const competitorDay: SurveySection = {
  id: 'day',
  title: 'Your Day',
  questions: [
    {
      key: 'respondent', kind: 'single', label: 'Who\u2019s filling this out?',
      hint: 'Parents of younger competitors get this survey too',
      options: ['I competed', 'A parent or guardian of a competitor'], required: true,
    },
    { key: 'divisions', kind: 'multi', label: 'Which division(s) did you (or your competitor) compete in?', options: ['1A', 'X Division', 'Sport / Beginner / Junior'], required: true },
    { key: 'registration_rating', kind: 'scale5', label: 'How was registration, music upload, and email before the day?', scaleLabels: RATING_LABELS },
    { key: 'judging_rating', kind: 'scale5', label: 'Did the judging (NYYL ruleset) feel fair and well explained?', scaleLabels: RATING_LABELS },
    { key: 'schedule_rating', kind: 'scale5', label: 'How did the schedule and flow feel on the day?', hint: 'Check-in, run order, downtime', scaleLabels: RATING_LABELS },
    { key: 'stage_rating', kind: 'scale5', label: 'How were the stage, sound, and practice space for your freestyle?', scaleLabels: RATING_LABELS },
    {
      key: 'format_preference', kind: 'single', label: 'VSYC-26 had no prelims. For VSYC-27, would you rather:',
      options: ['Keep it: everyone gets one full freestyle', 'Add prelims and finals', 'No preference'],
    },
    { key: 'tools_used', kind: 'multi', label: 'Did you use any of these on the day?', hint: 'Tap all that apply', options: TOOLS_USED },
    { key: 'compete_next_year', kind: 'single', label: 'Will you compete at VSYC-27?', options: ['Yes', 'Probably', 'Not sure', 'No'] },
  ],
};

const spectatorDay: SurveySection = {
  id: 'day',
  title: 'Your Day',
  questions: [
    { key: 'watch_mode', kind: 'single', label: 'How did you watch VSYC-26?', hint: 'The livestream counts whether you watched live or the replay', options: WATCH_MODES, required: true },
    {
      key: 'heard_from', kind: 'single', label: 'How did you hear about VSYC-26?',
      options: ['Came with a competitor', 'Friend or family', 'Instagram / social', 'YouTube / YoYo Contest Central', 'DMV Throwers club', 'Walking by at the mall', 'Poster or flyer', 'Goodles', 'Other'],
      required: true,
    },
    { key: 'first_contest', kind: 'single', label: 'Was this your first yo-yo contest?', options: ['Yes, first one', 'No, been before'] },
    { key: 'rsvped', kind: 'single', label: 'Did you RSVP online before the contest?', options: ['Yes', 'No, just showed up', 'Not sure'], hideIf: STREAM_ONLY },
    {
      key: 'time_on_site', kind: 'single', label: 'How long did you stay?',
      options: ['Under 30 minutes', '30 min – 1 hour', '1–3 hours', '3+ hours'],
      midpoints: { 'Under 30 minutes': 0.25, '30 min – 1 hour': 0.75, '1–3 hours': 2, '3+ hours': 4 },
      hideIf: STREAM_ONLY,
    },
    { key: 'favorite_part', kind: 'multi', label: 'What did you enjoy most?', hint: 'Tap all that apply', options: ['Competitor routines', 'Closing ceremony / awards', 'Stella Duellum', 'Vendor tables', 'Maker Corner', 'Goodles booth', 'MINISO mascot', 'Nail painting at Bmore YoYo Club', 'The crowd / energy'], hideIf: STREAM_ONLY },
    { key: 'tools_used', kind: 'multi', label: 'Did you use any of these?', hint: 'Tap all that apply', options: TOOLS_USED },
    { key: 'come_back', kind: 'single', label: 'Would you come back next year?', options: ['Yes, and bring others', 'Yes', 'Maybe', 'No'], hideIf: STREAM_ONLY },
  ],
};

/** Spectators who watched the YoYo Contest Central livestream. */
const streamSection: SurveySection = {
  id: 'stream',
  title: 'The Livestream',
  blurb: 'The YoYo Contest Central stream on YouTube, live on the day or the replay (VOD).',
  showIf: WATCHED_STREAM,
  questions: [
    { key: 'stream_when', kind: 'single', label: 'Did you watch live or the replay?', options: ['Live on the day', 'The replay (VOD)', 'Both'] },
    {
      key: 'stream_watch_time', kind: 'single', label: 'About how long did you watch?',
      options: ['Under 15 minutes', '15–60 minutes', '1–3 hours', 'Most of the day'],
      midpoints: { 'Under 15 minutes': 0.15, '15–60 minutes': 0.6, '1–3 hours': 2, 'Most of the day': 5 },
    },
    { key: 'stream_overall', kind: 'scale5', label: 'Overall, how was the stream?', scaleLabels: RATING_LABELS, required: true },
    { key: 'stream_video', kind: 'scale5', label: 'How was the video quality?', scaleLabels: RATING_LABELS },
    { key: 'stream_audio', kind: 'scale5', label: 'How was the audio?', hint: 'Music, MC, commentary', scaleLabels: RATING_LABELS },
    { key: 'stream_see_tricks', kind: 'scale5', label: 'Could you actually see the tricks?', hint: 'Camera angles, framing, zoom', scaleLabels: RATING_LABELS },
    { key: 'stream_follow', kind: 'scale5', label: 'Were names, divisions, and results easy to follow?', scaleLabels: RATING_LABELS },
    { key: 'stream_reliability', kind: 'single', label: 'Did the stream hold up?', options: ['Smooth the whole time', 'A few hiccups', 'Kept buffering or dropping'] },
    {
      key: 'stream_wishlist', kind: 'multi', label: 'What would make the stream better?', hint: 'Tap all that apply',
      options: ['Replays / slow-mo of big tricks', 'Score or ranking overlays', 'Competitor intros', 'More commentary', 'More camera angles', 'More chat interaction'],
    },
    {
      key: 'stream_why_remote', kind: 'single', label: 'What kept you from coming in person?',
      options: ['Too far to travel', 'Schedule conflict', 'Found out too late', 'Just prefer watching online', 'Other'], showIf: STREAM_ONLY,
    },
    {
      key: 'stream_attend_next', kind: 'single', label: 'Would you come in person next year?',
      options: ['Yes, planning on it', 'Maybe', "No, I'll watch the stream"], showIf: STREAM_ONLY,
    },
    { key: 'stream_feedback', kind: 'text', label: 'Anything else about the stream?', maxLength: 1000 },
  ],
};

const volunteerDay: SurveySection = {
  id: 'day',
  title: 'Your Shift',
  questions: [
    {
      key: 'volunteer_roles', kind: 'multi', label: 'What role(s) did you end up doing?', hint: 'Tap all that apply', required: true,
      options: [...VOLUNTEER_ROLES.map((r) => r.label), 'Floater / wherever needed'],
    },
    {
      key: 'volunteer_hours', kind: 'single', label: 'About how many hours did you volunteer?',
      hint: 'Volunteer hours count toward grant and nonprofit applications',
      options: ['Under 2', '2–4', '4–6', '6–8', '8+'],
      midpoints: { 'Under 2': 1.5, '2–4': 3, '4–6': 5, '6–8': 7, '8+': 9 },
    },
    { key: 'role_matched', kind: 'single', label: 'Did it match what you signed up for?', options: ['Yes', 'Mostly', 'No'] },
    { key: 'comms_rating', kind: 'scale5', label: 'How clear was communication before the event?', scaleLabels: RATING_LABELS },
    { key: 'support_rating', kind: 'scale5', label: 'Did you feel prepared and supported on the day?', hint: 'Training, tools, laptops, breaks', scaleLabels: RATING_LABELS },
    { key: 'volunteer_again', kind: 'single', label: 'Would you volunteer at VSYC-27?', options: ['Yes, same role', 'Yes, different role', 'Maybe', 'No'] },
    { key: 'volunteer_advice', kind: 'text', label: 'Advice for next year’s volunteers?', hint: 'We may share this in onboarding', maxLength: 1000 },
  ],
};

const sponsorDay: SurveySection = {
  id: 'day',
  title: 'Your Sponsorship',
  questions: [
    { key: 'sponsor_org', kind: 'short', label: 'Brand / organization', required: true, maxLength: 120 },
    {
      key: 'sponsor_tier', kind: 'single', label: 'Your sponsorship tier',
      options: ['Presenting (Diamond)', 'Platinum', 'Gold', 'Silver', 'Bronze', 'In-kind', 'Partner / club'],
    },
    {
      key: 'sponsor_goals', kind: 'multi', label: 'What were you hoping to get out of it?', hint: 'Tap all that apply',
      options: ['Brand awareness', 'Product sampling', 'Sales', 'Leads / sign-ups', 'Social content', 'Community goodwill'],
    },
    { key: 'visibility_rating', kind: 'scale5', label: 'Did your brand get the visibility you expected?', hint: 'Signage, MC shoutouts, table, social', scaleLabels: RATING_LABELS },
    { key: 'engagement', kind: 'text', label: 'What impact did you see?', hint: 'Samples handed out, sign-ups, new followers, leads. Numbers help.', maxLength: 1000 },
    {
      key: 'sponsor_delivered', kind: 'single', label: 'Did you get everything your tier promised?',
      options: ['Yes, everything', 'Mostly', 'Some things were missing'],
    },
    {
      key: 'sponsor_benefits_value', kind: 'multi', label: 'Which benefits were worth the most to you?', hint: 'Tap all that apply',
      options: ['Table on the floor', 'MC shoutouts', 'Logo on banner and flyers', 'Livestream credit', 'Social media posts', 'Free competitor registrations', 'Prize placement (winner bags)'],
    },
    { key: 'value_rating', kind: 'scale5', label: 'Did we deliver on those goals for what you put in?', scaleLabels: RATING_LABELS },
    { key: 'sponsor_next_year', kind: 'single', label: 'Would you sponsor VSYC-27?', options: ['Yes, same tier', 'Yes, different tier', 'Maybe', 'No'] },
    { key: 'clearer_yes', kind: 'text', label: 'What would make next year an easy yes?', maxLength: 1000 },
  ],
};

const PRIZE_RATING_LABELS: [string, string] = ['1 · Meh', '5 · Loved it'];

/** Only sent to the top 3 in each division, who got prizes (see lib/standings.ts). */
const winnerPrizes: SurveySection = {
  id: 'prizes',
  title: 'Your Prizes',
  blurb: 'Congrats. Tell us what you thought of what you took home.',
  questions: [
    { key: 'placement', kind: 'single', label: 'Where did you place?', hint: 'If you placed in two divisions, pick your best',
      options: ['1st', '2nd', '3rd'], required: true },
    {
      key: 'prizes_known_before', kind: 'single', label: 'Did you know about the prizes before you competed?',
      options: ['Yes, and it made me more excited to compete', 'Yes, but it didn\u2019t change anything', 'No'],
    },
    {
      key: 'prizes_received', kind: 'multi', label: 'What did you take home?', hint: 'Tap all that apply', required: true,
      options: ['Goodles shirt', 'Goodles Mac', 'MINISO basket', 'Yo-yo', 'String', 'Kendama', 'Something else'],
    },
    {
      // Bags were packed on the day from sponsor drops, so this doubles as our record of what went out.
      key: 'prize_items_detail', kind: 'short', label: 'Which yo-yo, string, or kendama did you get?', hint: 'Brand or model if you know it',
      maxLength: 300, showIf: { key: 'prizes_received', anyOf: ['Yo-yo', 'String', 'Kendama', 'Something else'] },
    },
    {
      key: 'gear_prize_rating', kind: 'scale5', label: 'Rate the yo-yo / string / kendama you got', scaleLabels: PRIZE_RATING_LABELS,
      showIf: { key: 'prizes_received', anyOf: ['Yo-yo', 'String', 'Kendama'] },
    },
    { key: 'prize_overall_rating', kind: 'scale5', label: 'How was your prize package overall?', scaleLabels: PRIZE_RATING_LABELS },
    { key: 'miniso_basket_rating', kind: 'scale5', label: 'Rate the MINISO basket', scaleLabels: PRIZE_RATING_LABELS, showIf: { key: 'prizes_received', anyOf: ['MINISO basket'] } },
    {
      key: 'miniso_brand_view', kind: 'single', label: 'Would you shop at MINISO after this?',
      options: ['Already a fan', 'Yes, more likely now', 'Maybe', 'No'], showIf: { key: 'prizes_received', anyOf: ['MINISO basket'] },
    },
    { key: 'goodles_prize_rating', kind: 'scale5', label: 'Rate the Goodles shirt and Mac', scaleLabels: PRIZE_RATING_LABELS, showIf: { key: 'prizes_received', anyOf: ['Goodles shirt', 'Goodles Mac'] } },
    {
      key: 'goodles_prize_tried', kind: 'single', label: 'Have you tried the Goodles from your prize yet?',
      options: ['Yes, loved it', 'Yes, it was OK', 'Not yet', 'Gave it away / shared it'], showIf: { key: 'prizes_received', anyOf: ['Goodles Mac'] },
    },
    { key: 'prize_posted', kind: 'single', label: 'Did you post your prizes?', hint: 'Tagging the sponsors helps us keep them for next year', options: ['Yes, tagged the sponsors', 'Yes, no tags', 'Planning to', 'No'] },
    {
      key: 'prize_wishlist', kind: 'multi', label: 'What prizes would you most want next year?', hint: 'Tap all that apply',
      options: ['Yo-yos / gear', 'Cash', 'Trophy / medal', 'Sponsor product baskets', 'Apparel', 'Gift cards', 'Free entry next year'],
    },
    { key: 'prize_feedback', kind: 'text', label: 'Favorite thing you took home, or anything else about the prizes?', maxLength: 1000 },
  ],
};

const SALES = ['Under $100', '$100–250', '$250–500', '$500–1,000', '$1,000–2,500', '$2,500+', 'Prefer not to say'] as const;
const SALES_MID: Record<string, number> = {
  'Under $100': 50, '$100–250': 175, '$250–500': 375, '$500–1,000': 750, '$1,000–2,500': 1750, '$2,500+': 3000,
};

const vendorDay: SurveySection = {
  id: 'day',
  title: 'Your Table',
  blurb: 'Your numbers stay private. We only share totals across all vendors.',
  questions: [
    { key: 'vendor_name', kind: 'single', label: 'Which vendor are you?', options: [...VENDOR_RESPONDENTS, 'Other'], required: true },
    { key: 'vendor_name_other', kind: 'short', label: 'Vendor name', maxLength: 120, showIf: { key: 'vendor_name', anyOf: ['Other'] } },
    { key: 'vendor_sales', kind: 'single', label: 'About how much did you sell (gross)?', options: SALES, midpoints: SALES_MID, required: true },
    { key: 'vendor_vs_expectations', kind: 'single', label: 'How did sales compare to what you expected?', options: ['Beat expectations', 'About what we expected', 'Below expectations'] },
    { key: 'vendor_vs_other_contests', kind: 'single', label: 'How did VSYC-26 compare to other contests you\u2019ve vended?', options: ['Better', 'About the same', 'Worse', 'First contest we\u2019ve vended'] },
    { key: 'vendor_top_sellers', kind: 'short', label: 'What sold best?', maxLength: 300 },
    { key: 'vendor_new_customers', kind: 'single', label: 'Were your buyers mostly new or existing customers?', options: ['Mostly new to us', 'A mix', 'Mostly existing customers'] },
    { key: 'vendor_buyers', kind: 'multi', label: 'Who bought from you?', hint: 'Tap all that apply', options: ['Competitors', 'Spectators / families', 'Mall shoppers passing by', 'Other vendors / staff'] },
    { key: 'vendor_location_rating', kind: 'scale5', label: 'Table location and foot traffic', scaleLabels: RATING_LABELS },
    { key: 'vendor_logistics_rating', kind: 'scale5', label: 'Load-in, setup, and communication from us', scaleLabels: RATING_LABELS },
    { key: 'vendor_next_year', kind: 'single', label: 'Would you vend at VSYC-27?', options: ['Yes', 'Maybe', 'No'] },
    {
      key: 'vendor_fair_fee', kind: 'single', label: 'What table fee would still be worth it to you next year?',
      hint: 'This year: $75 table add-on, $50 for hobby clubs',
      options: ['Free only', 'Up to $50', '$50–75', '$75–100', '$100+'],
    },
    { key: 'vendor_improve', kind: 'text', label: 'What would make vending better next year?', hint: 'Table size, placement, power, MC shoutouts, pricing', maxLength: 1000 },
  ],
};

// ─── Survey definitions ─────────────────────────────────────────────────────

export const SURVEYS: Record<SurveyType, SurveyDef> = {
  competitor: {
    type: 'competitor',
    eyebrow: 'Competitor Feedback',
    title: 'You’re the reason this contest exists.',
    intro: 'Win, lose, or somewhere in between, tell us how it felt to compete. About 5 minutes. Your answers shape VSYC-27.',
    sections: [competitorDay, contestSection(), duelSection(), weekendSection(), goodlesSection(), stayInTouchSection()],
  },
  winner: {
    type: 'winner',
    eyebrow: 'Winner Feedback',
    title: 'You made the podium. Tell us how it went.',
    intro: 'Same survey as every competitor, plus a few questions about your prizes. About 6 minutes. Your answers shape VSYC-27 and help us keep great prize sponsors.',
    sections: [competitorDay, winnerPrizes, contestSection(), duelSection(), weekendSection(), goodlesSection(), stayInTouchSection()],
  },
  spectator: {
    type: 'spectator',
    eyebrow: 'Spectator Feedback',
    title: 'You came to watch. Tell us how it went.',
    intro: 'In person, walked by, or watched the stream: your answers help make next year bigger and better. About 5 minutes.',
    sections: [spectatorDay, streamSection, contestSection(), duelSection(), weekendSection(), goodlesSection(), stayInTouchSection()],
  },
  volunteer: {
    type: 'volunteer',
    eyebrow: 'Volunteer Feedback',
    title: 'You made September 19th work.',
    intro: 'Tell us what it was really like behind the scenes. About 5 minutes.',
    sections: [volunteerDay, contestSection(), duelSection(), weekendSection(), goodlesSection(), stayInTouchSection()],
  },
  vendor: {
    type: 'vendor',
    eyebrow: 'Vendor Feedback',
    title: 'Thanks for setting up shop at VSYC-26.',
    intro: 'Tell us how sales went and what would make vending better. About 5 minutes. Your numbers stay private.',
    sections: [vendorDay, contestSection(), duelSection(), weekendSection({ includeVendorSpend: false }), goodlesSection(true), stayInTouchSection()],
  },
  sponsor: {
    type: 'sponsor',
    eyebrow: 'Sponsor Feedback',
    title: 'Your support made VSYC-26 possible.',
    intro: 'Help us show what your sponsorship delivered and what would make it better. About 5 minutes.',
    sections: [sponsorDay, contestSection(), duelSection(), weekendSection(), goodlesSection(true), stayInTouchSection()],
  },
};

export function allQuestions(type: SurveyType): SurveyQuestion[] {
  return SURVEYS[type].sections.flatMap((s) => s.questions);
}

/** Values derived from other answers, usable in conditions like real answers. */
function derived(key: string, answers: Record<string, unknown>): unknown {
  if (key === 'duel_engaged') {
    const watched = answers.duel_watched;
    const saw = answers.duel_competed === 'Yes'
      || watched === 'Watched it in person' || watched === 'Watched it on the stream';
    return saw ? 'yes' : undefined;
  }
  return answers[key];
}

function conditionMet(c: Condition, answers: Record<string, unknown>): boolean {
  const v = derived(c.key, answers);
  if (Array.isArray(v)) return v.some((x) => typeof x === 'string' && c.anyOf.includes(x));
  return typeof v === 'string' && c.anyOf.includes(v);
}

function visible(item: { showIf?: Condition; hideIf?: Condition }, answers: Record<string, unknown>): boolean {
  if (item.showIf && !conditionMet(item.showIf, answers)) return false;
  if (item.hideIf && conditionMet(item.hideIf, answers)) return false;
  return true;
}

export function isQuestionVisible(q: SurveyQuestion, answers: Record<string, unknown>): boolean {
  return visible(q, answers);
}

export function isSectionVisible(s: SurveySection, answers: Record<string, unknown>): boolean {
  return visible(s, answers);
}

/**
 * Walks the survey in order and works out what the respondent actually sees.
 * Conditions only count answers to questions that are themselves visible, so
 * a stale answer left behind after someone changes their mind (e.g. picked
 * "No" to Stella Duellum after first picking "Yes") can't unlock anything.
 */
export function surveyPlan(type: SurveyType, answers: Record<string, unknown>) {
  const effective: Record<string, unknown> = {};
  const sectionIds = new Set<string>();
  const questions: SurveyQuestion[] = [];
  for (const s of SURVEYS[type].sections) {
    if (!isSectionVisible(s, effective)) continue;
    sectionIds.add(s.id);
    for (const q of s.questions) {
      if (!isQuestionVisible(q, effective)) continue;
      questions.push(q);
      if (answers[q.key] !== undefined) effective[q.key] = answers[q.key];
    }
  }
  return { sectionIds, questionKeys: new Set(questions.map((q) => q.key)), questions };
}

/** Questions the respondent can actually see, given their answers so far. */
export function visibleQuestions(type: SurveyType, answers: Record<string, unknown>): SurveyQuestion[] {
  return surveyPlan(type, answers).questions;
}

export type SurveyAnswerValue = string | number | string[];
export type SurveyAnswers = Record<string, SurveyAnswerValue>;

/**
 * Validates and normalizes raw answers against the survey definition.
 * Unknown keys are dropped, option values must match exactly, hidden
 * conditional questions are discarded. Returns an error message on failure.
 */
export function validateSurveyAnswers(
  type: SurveyType,
  raw: unknown,
): { ok: true; answers: SurveyAnswers } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Answers must be an object' };
  }
  const input = raw as Record<string, unknown>;
  const out: SurveyAnswers = {};

  for (const q of visibleQuestions(type, input)) {
    const v = input[q.key];
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (q.required) return { ok: false, error: `Please answer: ${q.label}` };
      continue;
    }

    switch (q.kind) {
      case 'single':
        if (typeof v !== 'string' || !q.options?.includes(v)) return { ok: false, error: `Invalid answer for: ${q.label}` };
        out[q.key] = v;
        break;
      case 'multi': {
        if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !q.options?.includes(x))) {
          return { ok: false, error: `Invalid answer for: ${q.label}` };
        }
        out[q.key] = Array.from(new Set(v as string[]));
        break;
      }
      case 'scale5':
      case 'nps': {
        const n = typeof v === 'string' ? Number(v) : v;
        const max = q.kind === 'nps' ? 10 : 5;
        const min = q.kind === 'nps' ? 0 : 1;
        if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
          return { ok: false, error: `Invalid answer for: ${q.label}` };
        }
        out[q.key] = n;
        break;
      }
      case 'text':
      case 'short': {
        if (typeof v !== 'string') return { ok: false, error: `Invalid answer for: ${q.label}` };
        const trimmed = v.trim().slice(0, q.maxLength ?? 1000);
        if (trimmed) out[q.key] = trimmed;
        else if (q.required) return { ok: false, error: `Please answer: ${q.label}` };
        break;
      }
    }
  }

  return { ok: true, answers: out };
}
