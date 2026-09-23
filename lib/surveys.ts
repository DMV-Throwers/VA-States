/**
 * VSYC-26 post-event feedback surveys — single source of truth shared by:
 *  - the unlisted survey pages (app/survey/[type]/page.tsx)
 *  - server-side validation (app/api/survey/route.ts)
 *  - the admin Surveys tab (components/SurveyResults.tsx)
 *
 * Every respondent type gets the SAME shared blocks (contest, weekend spend,
 * Goodles, stay in touch) so results can be compared across groups and the
 * economic-impact numbers cover everyone who was there. Only the opening
 * "Your day" block changes per role.
 *
 * Question `key`s are stored as JSON keys in vsyc26_survey_responses.answers.
 * Never rename a key once responses exist — add a new one instead.
 */

export const SURVEY_TYPES = ['competitor', 'spectator', 'volunteer', 'sponsor'] as const;
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

function weekendSection(): SurveySection {
  return {
    id: 'weekend',
    title: 'Your Weekend',
    blurb: 'Rough guesses are fine. This shows venues and partners the real impact of the contest.',
    questions: [
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
    ],
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
    { key: 'engagement', kind: 'text', label: 'What engagement did you see?', hint: 'Samples handed out, leads, sales. Numbers help.', maxLength: 1000 },
    { key: 'value_rating', kind: 'scale5', label: 'Was it worth it at your tier?', scaleLabels: RATING_LABELS },
    { key: 'sponsor_next_year', kind: 'single', label: 'Would you sponsor VSYC-27?', options: ['Yes, same tier', 'Yes, different tier', 'Maybe', 'No'] },
    { key: 'clearer_yes', kind: 'text', label: 'What would make next year an easy yes?', maxLength: 1000 },
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
