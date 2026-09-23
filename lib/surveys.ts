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
 * (top 3 per division) and sales questions for vendors.
 *
 * Question `key`s are stored as JSON keys in vsyc26_survey_responses.answers.
 * Never rename a key once responses exist — add a new one instead.
 */

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
  /** Only shown (and only accepted) when another answer matches one of these values. */
  showIf?: { key: string; anyOf: readonly string[] };
  /** Ends of a scale, shown under the buttons. */
  scaleLabels?: [string, string];
  /** Numeric midpoint per option, used by the dashboard to estimate totals. */
  dollarMidpoints?: Record<string, number>;
  maxLength?: number;
}

export interface SurveySection {
  id: string;
  title: string;
  blurb?: string;
  questions: SurveyQuestion[];
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

const WEEKEND_SPEND = ['Under $50', '$50–100', '$100–250', '$250–500', '$500+'] as const;
const WEEKEND_SPEND_MID: Record<string, number> = {
  'Under $50': 25, '$50–100': 75, '$100–250': 175, '$250–500': 375, '$500+': 600,
};

const DULLES_SPEND = ['$0', '$1–25', '$25–75', '$75–150', '$150+'] as const;
const DULLES_SPEND_MID: Record<string, number> = {
  '$0': 0, '$1–25': 13, '$25–75': 50, '$75–150': 113, '$150+': 175,
};

const VENDOR_SPEND = ['$0', '$1–25', '$25–75', '$75–150', '$150+'] as const;

const AFTER_PARTY = ["Didn't go", 'Went · spent $0', 'Went · $1–20', 'Went · $20–50', 'Went · $50+'] as const;
const AFTER_PARTY_MID: Record<string, number> = {
  "Didn't go": 0, 'Went · spent $0': 0, 'Went · $1–20': 10, 'Went · $20–50': 35, 'Went · $50+': 60,
};

const AMENITIES = [
  'Parking',
  'Food court / restaurants',
  'Restrooms',
  'Seating / eating areas',
  'Charging',
  'Shopping in other stores',
  'Yo-yo vendor tables',
  'Hotel shuttle / lobby',
] as const;

// Goodles
const GOODLES_FAMILIARITY = [
  'Never heard of it',
  "Heard of it, hadn't tried it",
  'Tried it before',
  'Buy it regularly',
] as const;
const GOODLES_BOOTH = ['Stopped by', "Saw it, didn't stop", "Didn't notice it"] as const;
const GOODLES_ACTIVITIES = [
  'Tried a sample',
  'Took product home',
  'Took a photo',
  'Played a game / challenge',
  'Talked with the Goodles team',
  'Followed Goodles on social',
] as const;
const GOODLES_INTENT = ['Much more likely', 'A bit more likely', 'No change', 'Less likely'] as const;
const GOODLES_AFFINITY = [
  'Yes, a lot more',
  'Yes, a little more',
  'No difference',
] as const;

// ─── Shared sections ────────────────────────────────────────────────────────

function contestSection(): SurveySection {
  return {
    id: 'contest',
    title: 'The Contest',
    blurb: 'Big picture. Be honest. It only helps.',
    questions: [
      { key: 'overall_rating', kind: 'scale5', label: 'Overall, how was VSYC-26?', required: true, scaleLabels: RATING_LABELS },
      { key: 'venue_rating', kind: 'scale5', label: 'How was Dulles Town Center as the venue?', hint: 'Space, sound, sightlines, getting around', scaleLabels: RATING_LABELS },
      { key: 'did_well', kind: 'text', label: 'What did we do well? What should we keep?', maxLength: 1500 },
      { key: 'do_better', kind: 'text', label: 'What should we do better next year?', maxLength: 1500 },
      {
        key: 'recommend_nps', kind: 'nps', required: true,
        label: 'How likely are you to recommend VSYC to a friend?',
        scaleLabels: ['0 · Not at all', '10 · Absolutely'],
      },
    ],
  };
}

function weekendSection({ includeVendorSpend = true } = {}): SurveySection {
  const questions: SurveyQuestion[] = [
    { key: 'travel_time', kind: 'single', label: 'How far did you travel to get here?', options: TRAVEL },
    { key: 'home_zip', kind: 'short', label: 'Home zip code', hint: 'Optional. Only used to map where people came from.', placeholder: '22201', maxLength: 10 },
    { key: 'group_size', kind: 'single', label: 'Including you, how many people were in your group?', options: GROUP_SIZE },
    { key: 'hotel_nights', kind: 'single', label: 'How many nights did you stay at a local hotel?', options: HOTEL_NIGHTS },
    { key: 'hotel_group_rate', kind: 'single', label: 'VA States had a hotel group rate. Did you know?', options: GROUP_RATE },
    {
      key: 'weekend_spend', kind: 'single',
      label: 'About how much did your group spend this weekend?',
      hint: 'Gas, hotel, food, shopping. Leave out entry fees.',
      options: WEEKEND_SPEND, dollarMidpoints: WEEKEND_SPEND_MID,
    },
    {
      key: 'dulles_spend', kind: 'single',
      label: 'How much of that went to Dulles Town Center stores and restaurants?',
      options: DULLES_SPEND, dollarMidpoints: DULLES_SPEND_MID,
    },
    { key: 'vendor_spend', kind: 'single', label: 'How much did you spend at yo-yo vendor tables?', options: VENDOR_SPEND, dollarMidpoints: DULLES_SPEND_MID },
    { key: 'amenities_used', kind: 'multi', label: 'Which amenities did you use?', hint: 'Tap all that apply', options: AMENITIES },
    {
      key: 'after_party', kind: 'single',
      label: 'Did you go to the after-party? About how much did you spend?',
      options: AFTER_PARTY, dollarMidpoints: AFTER_PARTY_MID,
    },
  ];
  return {
    id: 'weekend',
    title: 'Your Weekend',
    blurb: 'Rough guesses are fine. This shows venues and partners the real impact of the contest.',
    questions: includeVendorSpend ? questions : questions.filter((q) => q.key !== 'vendor_spend'),
  };
}

function goodlesSection(sponsorView = false): SurveySection {
  return {
    id: 'goodles',
    title: 'Goodles',
    blurb: 'Goodles brought VSYC-26 to you. Tell us what you thought.',
    questions: [
      { key: 'goodles_familiarity', kind: 'single', label: 'Before VSYC-26, how well did you know Goodles?', options: GOODLES_FAMILIARITY, required: true },
      { key: 'goodles_booth', kind: 'single', label: 'Did you stop by the Goodles booth?', options: GOODLES_BOOTH, required: true },
      {
        key: 'goodles_activities', kind: 'multi', label: 'What did you do there?', hint: 'Tap all that apply',
        options: GOODLES_ACTIVITIES, showIf: { key: 'goodles_booth', anyOf: ['Stopped by'] },
      },
      {
        key: 'goodles_booth_rating', kind: 'scale5',
        label: sponsorView ? 'Rate the Goodles activation' : 'Rate the Goodles booth',
        scaleLabels: RATING_LABELS, showIf: { key: 'goodles_booth', anyOf: ['Stopped by'] },
      },
      { key: 'goodles_purchase_intent', kind: 'single', label: 'After VSYC-26, how likely are you to buy Goodles?', options: GOODLES_INTENT },
      {
        key: 'goodles_affinity', kind: 'single',
        label: 'Does Goodles backing a yo-yo contest make you think more of the brand?',
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

function stayInTouchSection(): SurveySection {
  return {
    id: 'contact',
    title: 'Stay in Touch',
    blurb: 'All optional.',
    questions: [
      { key: 'posted_social', kind: 'single', label: 'Did you post about VSYC-26?', options: ['Yes, already', 'Planning to', 'No'] },
      { key: 'ig_handle', kind: 'short', label: 'Instagram handle, so we can tag you', placeholder: '@yourhandle', maxLength: 60 },
    ],
  };
}

// ─── Per-role opening blocks ────────────────────────────────────────────────

const competitorDay: SurveySection = {
  id: 'day',
  title: 'Your Day',
  questions: [
    { key: 'divisions', kind: 'multi', label: 'Which division(s) did you compete in?', options: ['1A', 'X Division', 'Sport / Beginner / Junior'], required: true },
    { key: 'registration_rating', kind: 'scale5', label: 'Registration, music upload, and emails before the day', scaleLabels: RATING_LABELS },
    { key: 'judging_rating', kind: 'scale5', label: 'Judging: fair and well explained?', scaleLabels: RATING_LABELS },
    { key: 'schedule_rating', kind: 'scale5', label: 'Schedule and flow on the day', hint: 'Check-in, run order, downtime', scaleLabels: RATING_LABELS },
    { key: 'compete_next_year', kind: 'single', label: 'Will you compete at VSYC-27?', options: ['Yes', 'Probably', 'Not sure', 'No'] },
  ],
};

const spectatorDay: SurveySection = {
  id: 'day',
  title: 'Your Day',
  questions: [
    {
      key: 'heard_from', kind: 'single', label: 'How did you hear about VSYC-26?',
      options: ['Friend or family', 'Instagram / social', 'DMV Throwers club', 'Walking by at the mall', 'Goodles', 'Other'],
      required: true,
    },
    { key: 'first_contest', kind: 'single', label: 'Was this your first yo-yo contest?', options: ['Yes, first one', 'No, been before'] },
    { key: 'rsvped', kind: 'single', label: 'Did you RSVP before the day?', options: ['Yes', 'No, just showed up', 'Not sure'] },
    { key: 'favorite_part', kind: 'multi', label: 'What did you enjoy most?', hint: 'Tap all that apply', options: ['Competitor routines', 'Finals', 'Vendor tables', 'Learning to yo-yo', 'Goodles booth', 'The crowd / energy'] },
    { key: 'come_back', kind: 'single', label: 'Would you come back next year?', options: ['Yes, and bring others', 'Yes', 'Maybe', 'No'] },
  ],
};

const volunteerDay: SurveySection = {
  id: 'day',
  title: 'Your Shift',
  questions: [
    { key: 'volunteer_role', kind: 'short', label: 'What role(s) did you end up doing?', required: true, maxLength: 200 },
    { key: 'role_matched', kind: 'single', label: 'Did it match what you signed up for?', options: ['Yes', 'Mostly', 'No'] },
    { key: 'comms_rating', kind: 'scale5', label: 'Communication before the event', scaleLabels: RATING_LABELS },
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
    { key: 'visibility_rating', kind: 'scale5', label: 'Did your brand get the visibility you expected?', hint: 'Signage, MC shoutouts, table, social', scaleLabels: RATING_LABELS },
    { key: 'engagement', kind: 'text', label: 'What impact did you see?', hint: 'Samples handed out, sign-ups, new followers, leads. Numbers help.', maxLength: 1000 },
    { key: 'audience_fit', kind: 'scale5', label: 'How well did the VSYC crowd fit your brand\u2019s audience?', scaleLabels: ['1 · Poor fit', '5 · Perfect fit'] },
    { key: 'value_rating', kind: 'scale5', label: 'Was it worth it at your tier?', scaleLabels: RATING_LABELS },
    { key: 'sponsor_next_year', kind: 'single', label: 'Would you sponsor VSYC-27?', options: ['Yes, same tier', 'Yes, different tier', 'Maybe', 'No'] },
    { key: 'clearer_yes', kind: 'text', label: 'What would make next year an easy yes?', maxLength: 1000 },
  ],
};

const PRIZE_RATING_LABELS: [string, string] = ['1 · Meh', '5 · Loved it'];

/** Only sent to the top 3 in each division (see lib/standings.ts). */
const winnerPrizes: SurveySection = {
  id: 'prizes',
  title: 'Your Prizes',
  blurb: 'You placed. Congrats. Tell us what you thought of what you took home.',
  questions: [
    { key: 'placement_division', kind: 'single', label: 'Which division did you place in?', options: ['1A', 'X Division', 'Sport / Beginner / Junior'], required: true },
    { key: 'placement', kind: 'single', label: 'Where did you place?', options: ['1st', '2nd', '3rd'], required: true },
    { key: 'prize_overall_rating', kind: 'scale5', label: 'How was your prize package overall?', scaleLabels: PRIZE_RATING_LABELS },
    { key: 'miniso_basket_rating', kind: 'scale5', label: 'Rate the Miniso basket', scaleLabels: PRIZE_RATING_LABELS },
    { key: 'miniso_favorite', kind: 'short', label: 'Favorite thing in the Miniso basket?', maxLength: 200 },
    { key: 'miniso_brand_view', kind: 'single', label: 'Would you shop at Miniso after this?', options: ['Already a fan', 'Yes, more likely now', 'Maybe', 'No'] },
    { key: 'goodles_prize_rating', kind: 'scale5', label: 'Rate the Goodles additions', scaleLabels: PRIZE_RATING_LABELS },
    { key: 'goodles_prize_tried', kind: 'single', label: 'Have you tried the Goodles from your prize yet?', options: ['Yes, loved it', 'Yes, it was OK', 'Not yet', 'Gave it away / shared it'] },
    { key: 'prize_vs_other_contests', kind: 'single', label: 'How did the prizes compare to other contests you\u2019ve placed at?', options: ['Better', 'About the same', 'Not as good', 'First time placing'] },
    { key: 'prize_posted', kind: 'single', label: 'Did you post your prizes?', hint: 'Tagging Miniso and Goodles helps us keep them as sponsors', options: ['Yes, tagged the sponsors', 'Yes, no tags', 'Planning to', 'No'] },
    {
      key: 'prize_wishlist', kind: 'multi', label: 'What prizes would you most want next year?', hint: 'Tap all that apply',
      options: ['Yo-yos / gear', 'Cash', 'Trophy / medal', 'Sponsor product baskets', 'Gift cards', 'Free entry next year'],
    },
    { key: 'prize_feedback', kind: 'text', label: 'Anything else about the prizes?', maxLength: 1000 },
  ],
};

const SALES = ['Under $100', '$100–250', '$250–500', '$500–1,000', '$1,000–2,500', '$2,500+'] as const;
const SALES_MID: Record<string, number> = {
  'Under $100': 50, '$100–250': 175, '$250–500': 375, '$500–1,000': 750, '$1,000–2,500': 1750, '$2,500+': 3000,
};

const vendorDay: SurveySection = {
  id: 'day',
  title: 'Your Table',
  blurb: 'Your numbers stay private. We only share totals across all vendors.',
  questions: [
    { key: 'vendor_name', kind: 'single', label: 'Which vendor are you?', options: ['Freshly Dirty', 'Jake Bullock', 'Slow n Steady', 'Other'], required: true },
    { key: 'vendor_name_other', kind: 'short', label: 'Vendor name', maxLength: 120, showIf: { key: 'vendor_name', anyOf: ['Other'] } },
    { key: 'vendor_sales', kind: 'single', label: 'About how much did you sell (gross)?', options: SALES, dollarMidpoints: SALES_MID, required: true },
    { key: 'vendor_transactions', kind: 'single', label: 'About how many sales / customers?', options: ['1–10', '11–25', '26–50', '51–100', '100+'] },
    { key: 'vendor_vs_expectations', kind: 'single', label: 'How did sales compare to what you expected?', options: ['Beat expectations', 'About what we expected', 'Below expectations'] },
    { key: 'vendor_vs_other_contests', kind: 'single', label: 'How did VSYC-26 compare to other contests you\u2019ve vended?', options: ['Better', 'About the same', 'Worse', 'First contest we\u2019ve vended'] },
    { key: 'vendor_top_sellers', kind: 'short', label: 'What sold best?', maxLength: 300 },
    { key: 'vendor_buyers', kind: 'multi', label: 'Who bought from you?', hint: 'Tap all that apply', options: ['Competitors', 'Spectators / families', 'Mall shoppers passing by', 'Other vendors / staff'] },
    { key: 'vendor_location_rating', kind: 'scale5', label: 'Table location and foot traffic', scaleLabels: RATING_LABELS },
    { key: 'vendor_logistics_rating', kind: 'scale5', label: 'Load-in, setup, and communication from us', scaleLabels: RATING_LABELS },
    { key: 'vendor_next_year', kind: 'single', label: 'Would you vend at VSYC-27?', options: ['Yes', 'Maybe', 'No'] },
    { key: 'vendor_improve', kind: 'text', label: 'What would make vending better next year?', hint: 'Table size, placement, power, MC shoutouts, pricing', maxLength: 1000 },
  ],
};

// ─── Survey definitions ─────────────────────────────────────────────────────

export const SURVEYS: Record<SurveyType, SurveyDef> = {
  competitor: {
    type: 'competitor',
    eyebrow: 'Competitor Feedback',
    title: 'You’re the reason this contest exists.',
    intro: 'Win, lose, or somewhere in between, tell us how it felt to compete. About 4 minutes. Your answers shape VSYC-27.',
    sections: [competitorDay, contestSection(), weekendSection(), goodlesSection(), stayInTouchSection()],
  },
  winner: {
    type: 'winner',
    eyebrow: 'Winner Feedback',
    title: 'You made the podium. Tell us how it went.',
    intro: 'Same survey as every competitor, plus a few questions about your prizes. About 5 minutes. Your answers shape VSYC-27 and help us keep great prize sponsors.',
    sections: [competitorDay, winnerPrizes, contestSection(), weekendSection(), goodlesSection(), stayInTouchSection()],
  },
  spectator: {
    type: 'spectator',
    eyebrow: 'Spectator Feedback',
    title: 'You came to watch. Tell us how it went.',
    intro: 'Whether you RSVP’d or just walked by, your answers help make next year bigger and better. About 3 minutes.',
    sections: [spectatorDay, contestSection(), weekendSection(), goodlesSection(), stayInTouchSection()],
  },
  volunteer: {
    type: 'volunteer',
    eyebrow: 'Volunteer Feedback',
    title: 'You made September 19th work.',
    intro: 'Tell us what it was really like behind the scenes. About 4 minutes.',
    sections: [volunteerDay, contestSection(), weekendSection(), goodlesSection(), stayInTouchSection()],
  },
  vendor: {
    type: 'vendor',
    eyebrow: 'Vendor Feedback',
    title: 'Thanks for setting up shop at VSYC-26.',
    intro: 'Tell us how sales went and what would make vending better. About 4 minutes. Your numbers stay private.',
    sections: [vendorDay, contestSection(), weekendSection({ includeVendorSpend: false }), goodlesSection(true), stayInTouchSection()],
  },
  sponsor: {
    type: 'sponsor',
    eyebrow: 'Sponsor Feedback',
    title: 'Your support made VSYC-26 possible.',
    intro: 'Help us show what your sponsorship delivered and what would make it better. About 4 minutes.',
    sections: [sponsorDay, contestSection(), weekendSection(), goodlesSection(true), stayInTouchSection()],
  },
};

export function allQuestions(type: SurveyType): SurveyQuestion[] {
  return SURVEYS[type].sections.flatMap((s) => s.questions);
}

export function isQuestionVisible(q: SurveyQuestion, answers: Record<string, unknown>): boolean {
  if (!q.showIf) return true;
  const v = answers[q.showIf.key];
  return typeof v === 'string' && q.showIf.anyOf.includes(v);
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

  for (const q of allQuestions(type)) {
    if (!isQuestionVisible(q, input)) continue;
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
