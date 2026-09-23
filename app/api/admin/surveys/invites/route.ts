import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, apiError } from '@/lib/api-error';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminRequest } from '@/lib/auth/admin-request';
import { logAudit } from '@/lib/audit';
import { sendSurveyInviteBatch, type SurveyInviteRecipient } from '@/lib/email';
import { fetchStandings, winnersFrom, type Winner } from '@/lib/standings';

// Resend batch sends ~100 emails per request; give a few hundred room to finish.
export const maxDuration = 60;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://register.dmvthrowers.club';
const AUDIT_ACTION = 'survey_invites_sent';

const AUDIENCES: Record<string, { label: string; emailLabel: string; survey: string; extraLine?: string }> = {
  winner: {
    label: 'podium finishers',
    emailLabel: 'competitors',
    survey: 'winner',
    extraLine: 'You made the podium, so we also want to hear what you thought of your prizes, including the Miniso basket and the Goodles additions.',
  },
  competitor: { label: 'competitors', emailLabel: 'competitors', survey: 'competitor' },
  spectator: { label: 'spectators', emailLabel: 'spectators', survey: 'spectator' },
  volunteer: { label: 'volunteers', emailLabel: 'volunteers', survey: 'volunteer' },
};
type Audience = 'winner' | 'competitor' | 'spectator' | 'volunteer';

function isAudience(v: unknown): v is Audience {
  return typeof v === 'string' && Object.hasOwn(AUDIENCES, v);
}

async function loadWinners(): Promise<Winner[]> {
  return winnersFrom(await fetchStandings(createAdminClient()));
}

async function loadRecipients(audience: Audience, winners: Winner[]): Promise<SurveyInviteRecipient[]> {
  const supabase = createAdminClient();
  const list: SurveyInviteRecipient[] = [];

  if (audience === 'competitor' || audience === 'winner') {
    // Winners get the winner survey (competitor questions + prizes) instead
    // of the general competitor survey — never both.
    const winnerIds = new Set(winners.map((w) => w.registration_id));
    const { data, error } = await supabase
      .from('vsyc_registrations')
      .select('id, first_name, email, parent_email, age_on_event');
    if (error) throw new Error(error.message);
    for (const r of data ?? []) {
      if ((audience === 'winner') !== winnerIds.has(r.id)) continue;
      list.push({ to: r.email, firstName: r.first_name });
      // Minors: the parent usually has the inbox and the spend answers.
      if (r.age_on_event < 18 && r.parent_email) list.push({ to: r.parent_email, firstName: r.first_name });
    }
  } else if (audience === 'spectator') {
    const { data, error } = await supabase.from('vsyc_spectators').select('first_name, email');
    if (error) throw new Error(error.message);
    for (const r of data ?? []) list.push({ to: r.email, firstName: r.first_name });
  } else {
    const { data, error } = await supabase
      .from('vsyc_volunteers')
      .select('first_name, email')
      .eq('status', 'confirmed');
    if (error) throw new Error(error.message);
    for (const r of data ?? []) list.push({ to: r.email, firstName: r.first_name });
  }

  // One email per address, even if someone registered twice.
  const seen = new Set<string>();
  return list.filter((r) => {
    const key = r.to.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function lastSentAt(audience: Audience): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('vsyc_audit_log')
    .select('created_at')
    .eq('action', AUDIT_ACTION)
    .eq('details->>audience', audience)
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0]?.created_at ?? null;
}

/**
 * GET /api/admin/surveys/invites — recipient counts and last-sent time per
 * audience, plus the podium list the winner audience is built from, for the
 * Surveys tab. No emails are sent.
 */
export const GET = withErrorHandling(async (requestId, req: NextRequest) => {
  const auth = await requireAdminRequest(req, requestId);
  if (auth instanceof NextResponse) return auth;

  const winners = await loadWinners();
  const audiences = await Promise.all(
    (Object.keys(AUDIENCES) as Audience[]).map(async (a) => ({
      audience: a,
      recipients: (await loadRecipients(a, winners)).length,
      lastSentAt: await lastSentAt(a),
      surveyUrl: `${BASE_URL}/survey/${AUDIENCES[a].survey}?src=email`,
    })),
  );

  return NextResponse.json({ audiences, winners }, { headers: { 'x-request-id': requestId } });
});

/**
 * POST /api/admin/surveys/invites
 *
 * Emails the survey link to one audience. Body: { audience, force? }.
 * Refuses (409) if that audience was already sent to, unless force is true,
 * so a double-click never emails everyone twice.
 */
export const POST = withErrorHandling(async (requestId, req: NextRequest) => {
  const auth = await requireAdminRequest(req, requestId);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const audience = body?.audience;
  if (!isAudience(audience)) {
    return apiError('bad_request', 'audience must be winner, competitor, spectator, or volunteer', requestId);
  }

  const previous = await lastSentAt(audience);
  if (previous && body?.force !== true) {
    return apiError('conflict', `Survey invites already went to ${AUDIENCES[audience].label} on ${previous}.`, requestId);
  }

  const recipients = await loadRecipients(audience, await loadWinners());
  const surveyUrl = `${BASE_URL}/survey/${AUDIENCES[audience].survey}?src=email`;
  const result = await sendSurveyInviteBatch({
    audienceLabel: AUDIENCES[audience].emailLabel,
    surveyUrl,
    extraLine: AUDIENCES[audience].extraLine,
    recipients,
  });

  await logAudit(AUDIT_ACTION, {
    actor: auth.email ?? 'admin',
    details: {
      audience,
      total_recipients: recipients.length,
      sent: result.sent,
      failed: result.failed.length,
      failed_emails: result.failed.map((f) => f.email),
      resend: Boolean(previous),
    },
  });

  return NextResponse.json(
    { ok: true, audience, total: recipients.length, sent: result.sent, failed: result.failed },
    { headers: { 'x-request-id': requestId } },
  );
});
