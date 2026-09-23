'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SURVEYS, SURVEY_TYPES, type SurveyQuestion, type SurveyType } from '@/lib/surveys';

interface SurveyRow {
  id: string;
  created_at: string;
  survey_type: SurveyType;
  source: string | null;
  answers: Record<string, unknown>;
  contact_name: string | null;
  contact_email: string | null;
  allow_quote: boolean;
  quote_text: string | null;
}

interface InviteAudience {
  audience: 'winner' | 'competitor' | 'spectator' | 'volunteer';
  recipients: number;
  lastSentAt: string | null;
  surveyUrl: string;
}

interface WinnerRow {
  registration_id: string;
  display_name: string;
  division: '1A' | 'X' | 'SBJ';
  place: number;
}

type TypeFilter = 'all' | SurveyType;

const TYPE_LABELS: Record<SurveyType, string> = {
  competitor: 'Competitors',
  winner: 'Winners',
  spectator: 'Spectators',
  volunteer: 'Volunteers',
  vendor: 'Vendors',
  sponsor: 'Sponsors',
};

const PLACE_LABELS = ['', '1st', '2nd', '3rd'];

const HOTEL_NIGHTS: Record<string, number> = { '0 · Day trip': 0, '1 night': 1, '2 nights': 2, '3+ nights': 3 };

function unionQuestions(filter: TypeFilter): { sectionTitle: string; q: SurveyQuestion }[] {
  const types = filter === 'all' ? SURVEY_TYPES : [filter];
  const seen = new Set<string>();
  const out: { sectionTitle: string; q: SurveyQuestion }[] = [];
  for (const t of types) {
    for (const s of SURVEYS[t].sections) {
      for (const q of s.questions) {
        if (seen.has(q.key)) continue;
        seen.add(q.key);
        out.push({ sectionTitle: filter === 'all' && s.id === 'day' ? `${s.title} (${TYPE_LABELS[t]})` : s.title, q });
      }
    }
  }
  return out;
}

function avg(nums: number[]): number | null {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function pct(n: number, d: number): string {
  return d ? `${Math.round((n / d) * 100)}%` : '—';
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : Array.isArray(v) ? v.join('; ') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function SurveyResults({ token }: { token: string }) {
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [invites, setInvites] = useState<InviteAudience[]>([]);
  const [winners, setWinners] = useState<WinnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [filter, setFilter] = useState<TypeFilter>('all');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRows, resInv] = await Promise.all([
        fetch('/api/admin/surveys', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/surveys/invites', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (resRows.ok) setRows(((await resRows.json()) as { responses: SurveyRow[] }).responses);
      if (resInv.ok) {
        const inv = (await resInv.json()) as { audiences: InviteAudience[]; winners: WinnerRow[] };
        setInvites(inv.audiences);
        setWinners(inv.winners ?? []);
      }
      if (!resRows.ok) setStatusMsg('Could not load survey responses.');
    } catch {
      setStatusMsg('Network error loading surveys.');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const sendInvites = async (a: InviteAudience) => {
    const label = TYPE_LABELS[a.audience].toLowerCase();
    const resend = Boolean(a.lastSentAt);
    const prompt = resend
      ? `Invites already went to ${label} on ${new Date(a.lastSentAt!).toLocaleString()}. Send AGAIN to ${a.recipients} people?`
      : `Email the survey link to ${a.recipients} ${label}?`;
    if (!window.confirm(prompt)) return;

    setSending(a.audience);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/surveys/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ audience: a.audience, force: resend }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMsg(json.error?.message ?? 'Send failed.');
      } else {
        const failed = (json.failed as { email: string }[]).length;
        setStatusMsg(`Sent ${json.sent} of ${json.total} ${label} invites${failed ? ` · ${failed} failed` : ''}.`);
        await fetchData();
      }
    } catch {
      setStatusMsg('Network error sending invites.');
    }
    setSending(null);
  };

  const filtered = useMemo(() => (filter === 'all' ? rows : rows.filter((r) => r.survey_type === filter)), [rows, filter]);
  const questions = useMemo(() => unionQuestions(filter), [filter]);

  const kpis = useMemo(() => {
    const num = (k: string) => filtered.map((r) => r.answers[k]).filter((v): v is number => typeof v === 'number');
    const str = (k: string) => filtered.map((r) => r.answers[k]).filter((v): v is string => typeof v === 'string');

    const nps = num('recommend_nps');
    const promoters = nps.filter((n) => n >= 9).length;
    const detractors = nps.filter((n) => n <= 6).length;
    const npsScore = nps.length ? Math.round(((promoters - detractors) / nps.length) * 100) : null;

    const midSum = (k: string) => {
      const q = questions.find((x) => x.q.key === k)?.q;
      return str(k).reduce((sum, v) => sum + (q?.dollarMidpoints?.[v] ?? 0), 0);
    };

    const familiarity = str('goodles_familiarity');
    const newToGoodles = familiarity.filter((v) => v === 'Never heard of it' || v === "Heard of it, hadn't tried it").length;
    const booth = str('goodles_booth');
    const intent = str('goodles_purchase_intent');
    const moreLikely = intent.filter((v) => v === 'Much more likely' || v === 'A bit more likely').length;
    const hotelNights = str('hotel_nights').reduce((s, v) => s + (HOTEL_NIGHTS[v] ?? 0), 0);
    const prizePosted = str('prize_posted');
    const vendorNext = str('vendor_next_year');

    return {
      overall: avg(num('overall_rating')),
      npsScore,
      npsN: nps.length,
      weekendSpend: midSum('weekend_spend'),
      dullesSpend: midSum('dulles_spend'),
      vendorSpend: midSum('vendor_spend'),
      afterPartySpend: midSum('after_party'),
      hotelNights,
      newToGoodles,
      familiarityN: familiarity.length,
      boothVisited: booth.filter((v) => v === 'Stopped by').length,
      boothN: booth.length,
      moreLikely,
      intentN: intent.length,
      boothRating: avg(num('goodles_booth_rating')),
      hasPrizes: str('placement').length > 0,
      prizeOverall: avg(num('prize_overall_rating')),
      miniso: avg(num('miniso_basket_rating')),
      goodlesPrize: avg(num('goodles_prize_rating')),
      prizeTagged: prizePosted.filter((v) => v === 'Yes, tagged the sponsors').length,
      prizePostedN: prizePosted.length,
      vendorN: str('vendor_sales').length,
      vendorSales: midSum('vendor_sales'),
      vendorLocation: avg(num('vendor_location_rating')),
      vendorReturn: vendorNext.filter((v) => v === 'Yes').length,
      vendorNextN: vendorNext.length,
    };
  }, [filtered, questions]);

  const exportCsv = () => {
    const keys = questions.map((x) => x.q.key);
    const header = ['submitted_at', 'survey_type', 'source', ...keys, 'contact_name', 'contact_email', 'allow_quote', 'quote_text'];
    const lines = [header.join(',')];
    for (const r of filtered) {
      lines.push([
        r.created_at, r.survey_type, r.source,
        ...keys.map((k) => r.answers[k]),
        r.contact_name, r.contact_email, r.allow_quote ? 'yes' : 'no', r.quote_text,
      ].map(csvCell).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vsyc26-survey-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatusMsg(`Copied ${text}`);
    } catch {
      setStatusMsg(text);
    }
  };

  const counts = SURVEY_TYPES.map((t) => ({ t, n: rows.filter((r) => r.survey_type === t).length }));
  const quotes = filtered.filter((r) => r.allow_quote);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-2xl text-white">Post-Event Surveys</h2>
          <p className="text-xs text-text-muted mt-1">Unlisted links. Not in the nav, sitemap, or search.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void fetchData()} className="border border-navy-border px-3 py-2 text-xs text-text-body hover:text-white">
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button type="button" onClick={exportCsv} disabled={!filtered.length} className="border border-gold px-3 py-2 text-xs font-black tracking-caps text-gold hover:bg-gold hover:text-navy-deep disabled:opacity-40">
            EXPORT CSV ↓
          </button>
        </div>
      </div>

      {statusMsg && <div className="border border-navy-border bg-navy-deep p-3 text-sm text-white break-all">{statusMsg}</div>}

      {/* Links + invites */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border border-navy-border bg-navy-deep p-4">
          <h3 className="text-xs font-black tracking-caps text-gold mb-3">SHARE LINKS</h3>
          <ul className="space-y-2 text-sm">
            {SURVEY_TYPES.map((t) => {
              const live = `${baseUrl}/survey/${t}?src=${t === 'spectator' ? 'live' : 'direct'}`;
              return (
                <li key={t} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-text-body">{TYPE_LABELS[t]}</span>
                  <span className="flex gap-2">
                    <a href={live} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:text-gold-light">Open ↗</a>
                    <button type="button" onClick={() => void copy(live)} className="text-xs text-text-muted hover:text-white">Copy link</button>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-text-muted mt-3">
            The spectator link is the public live link for walk-ups who never RSVP&apos;d. Post it or put it on a QR code
            (swap <code>src=live</code> for <code>src=qr</code> to track QR scans separately). Send vendors and sponsors
            their links directly. Vendors who also sponsored (Freshly Dirty) take the vendor survey. The winner link is only for podium finishers.
          </p>
        </div>

        <div className="border border-navy-border bg-navy-deep p-4">
          <h3 className="text-xs font-black tracking-caps text-gold mb-3">EMAIL INVITES</h3>
          <ul className="space-y-3">
            {invites.map((a) => (
              <li key={a.audience} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <div className="text-white font-semibold">{TYPE_LABELS[a.audience]} · {a.recipients}</div>
                  <div className="text-xs text-text-muted">
                    {a.lastSentAt ? `Sent ${new Date(a.lastSentAt).toLocaleString()}` : 'Not sent yet'}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={sending !== null || a.recipients === 0}
                  onClick={() => void sendInvites(a)}
                  className={`px-3 py-2 text-xs font-black tracking-caps disabled:opacity-40 ${
                    a.lastSentAt ? 'border border-navy-border text-text-body hover:text-white' : 'bg-red text-white hover:bg-red-dark'
                  }`}
                >
                  {sending === a.audience ? 'SENDING…' : a.lastSentAt ? 'RESEND' : 'SEND'}
                </button>
              </li>
            ))}
            {!invites.length && !loading && <li className="text-xs text-text-muted">Invite list unavailable.</li>}
          </ul>
          <p className="text-xs text-text-muted mt-3">
            Winners: top 3 per division from final results, sent the winner survey (competitor questions + prizes) instead of the
            competitor one. Competitors and winners also go to the parent email for minors. Volunteers: confirmed only.
            Spectators: everyone who RSVP&apos;d. Duplicate addresses get one email.
          </p>
          {winners.length > 0 && (
            <details className="mt-3 border-t border-navy-border pt-3">
              <summary className="cursor-pointer text-xs font-black tracking-caps text-gold">WINNER LIST · {winners.length}</summary>
              <ul className="mt-2 space-y-1 text-xs text-text-body">
                {winners.map((w) => (
                  <li key={`${w.division}-${w.registration_id}`}>
                    <span className="text-text-muted">{w.division} · {PLACE_LABELS[w.place] ?? w.place}</span> · {w.display_name}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>

      {/* Filter */}
      <nav className="flex flex-wrap gap-2" aria-label="Filter by respondent type">
        {(['all', ...SURVEY_TYPES] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            aria-pressed={filter === t}
            className={`px-3 py-2 text-xs font-black tracking-caps border ${
              filter === t ? 'bg-gold text-navy-deep border-gold' : 'border-navy-border text-text-muted hover:text-white'
            }`}
          >
            {t === 'all' ? `ALL · ${rows.length}` : `${TYPE_LABELS[t].toUpperCase()} · ${counts.find((c) => c.t === t)?.n ?? 0}`}
          </button>
        ))}
      </nav>

      {!filtered.length ? (
        <p className="text-sm text-text-muted">{loading ? 'Loading…' : 'No responses yet.'}</p>
      ) : (
        <>
          {/* Headline numbers */}
          <section>
            <h3 className="text-xs font-black tracking-caps text-gold mb-3">CONTEST</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Responses" value={String(filtered.length)} />
              <Stat label="Avg overall rating" value={kpis.overall ? `${kpis.overall.toFixed(1)} / 5` : '—'} />
              <Stat label="NPS" value={kpis.npsScore === null ? '—' : String(kpis.npsScore)} note={`${kpis.npsN} answers · −100 to 100`} />
              <Stat label="Hotel nights" value={String(kpis.hotelNights)} note="Sum reported" />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black tracking-caps text-gold mb-3">ECONOMIC IMPACT (ESTIMATED)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Weekend spend" value={money(kpis.weekendSpend)} />
              <Stat label="At Dulles Town Center" value={money(kpis.dullesSpend)} />
              <Stat label="At vendor tables" value={money(kpis.vendorSpend)} note="Attendee-reported" />
              <Stat label="At after-party" value={money(kpis.afterPartySpend)} />
            </div>
            <p className="text-xs text-text-muted mt-2">
              Sum of bucket midpoints across responses. Spend is per group, so two people from one group can double count. Treat as a floor-to-ballpark figure for venue pitches, not an audit.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-black tracking-caps text-gold mb-3">GOODLES</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="New to Goodles" value={pct(kpis.newToGoodles, kpis.familiarityN)} note={`${kpis.newToGoodles} of ${kpis.familiarityN} hadn't tried it`} />
              <Stat label="Stopped at booth" value={pct(kpis.boothVisited, kpis.boothN)} note={`${kpis.boothVisited} of ${kpis.boothN}`} />
              <Stat label="Booth rating" value={kpis.boothRating ? `${kpis.boothRating.toFixed(1)} / 5` : '—'} />
              <Stat label="More likely to buy" value={pct(kpis.moreLikely, kpis.intentN)} note={`${kpis.moreLikely} of ${kpis.intentN}`} />
            </div>
          </section>

          {kpis.hasPrizes && (
            <section>
              <h3 className="text-xs font-black tracking-caps text-gold mb-3">PRIZES (WINNERS)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Prize package" value={kpis.prizeOverall ? `${kpis.prizeOverall.toFixed(1)} / 5` : '—'} />
                <Stat label="Miniso basket" value={kpis.miniso ? `${kpis.miniso.toFixed(1)} / 5` : '—'} />
                <Stat label="Goodles additions" value={kpis.goodlesPrize ? `${kpis.goodlesPrize.toFixed(1)} / 5` : '—'} />
                <Stat label="Posted + tagged sponsors" value={pct(kpis.prizeTagged, kpis.prizePostedN)} note={`${kpis.prizeTagged} of ${kpis.prizePostedN}`} />
              </div>
            </section>
          )}

          {kpis.vendorN > 0 && (
            <section>
              <h3 className="text-xs font-black tracking-caps text-gold mb-3">VENDORS</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Vendors responded" value={String(kpis.vendorN)} />
                <Stat label="Vendor sales" value={money(kpis.vendorSales)} note="Vendor-reported, bucket midpoints" />
                <Stat label="Location / traffic" value={kpis.vendorLocation ? `${kpis.vendorLocation.toFixed(1)} / 5` : '—'} />
                <Stat label="Would vend again" value={pct(kpis.vendorReturn, kpis.vendorNextN)} note={`${kpis.vendorReturn} of ${kpis.vendorNextN} said yes`} />
              </div>
              <p className="text-xs text-text-muted mt-2">Vendors were told their numbers stay private. Share totals only, never one vendor&apos;s sales.</p>
            </section>
          )}

          {/* Per-question breakdown */}
          <section className="space-y-6">
            <h3 className="text-xs font-black tracking-caps text-gold">EVERY QUESTION</h3>
            {questions.map(({ sectionTitle, q }, i) => (
              <div key={q.key}>
                {(i === 0 || questions[i - 1].sectionTitle !== sectionTitle) && (
                  <h4 className="font-display font-black text-lg text-white mt-6 mb-3 border-b border-navy-border pb-1">{sectionTitle}</h4>
                )}
                <QuestionBreakdown q={q} rows={filtered} />
              </div>
            ))}
          </section>

          {quotes.length > 0 && (
            <section>
              <h3 className="text-xs font-black tracking-caps text-gold mb-3">OK TO QUOTE · {quotes.length}</h3>
              <ul className="space-y-3">
                {quotes.map((r) => (
                  <li key={r.id} className="border-l-2 border-gold bg-navy-deep p-3 text-sm text-text-body">
                    <p className="text-white">
                      “{r.quote_text || (r.answers.did_well as string) || (r.answers.do_better as string) || '(no text, pull from answers)'}”
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {r.contact_name || 'Anonymous'} · {TYPE_LABELS[r.survey_type]}
                      {typeof r.answers.ig_handle === 'string' ? ` · ${r.answers.ig_handle}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-navy-border bg-navy-deep p-3">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="font-display font-black text-2xl text-white mt-1">{value}</div>
      {note && <div className="text-xs text-text-muted mt-0.5">{note}</div>}
    </div>
  );
}

function QuestionBreakdown({ q, rows }: { q: SurveyQuestion; rows: SurveyRow[] }) {
  const answered = rows.filter((r) => r.answers[q.key] !== undefined && r.answers[q.key] !== null);

  if (q.kind === 'text' || q.kind === 'short') {
    const texts = answered.map((r) => ({ id: r.id, type: r.survey_type, text: String(r.answers[q.key]) }));
    return (
      <details className="border border-navy-border bg-navy-deep">
        <summary className="cursor-pointer p-3 text-sm text-white">
          {q.label} <span className="text-text-muted">· {texts.length} answers</span>
        </summary>
        <ul className="px-3 pb-3 space-y-2 max-h-96 overflow-y-auto">
          {texts.map((t) => (
            <li key={t.id} className="text-sm text-text-body border-t border-navy-border pt-2">
              {t.text} <span className="text-xs text-text-muted">· {TYPE_LABELS[t.type]}</span>
            </li>
          ))}
          {!texts.length && <li className="text-xs text-text-muted">No answers yet.</li>}
        </ul>
      </details>
    );
  }

  let buckets: string[];
  if (q.kind === 'scale5') buckets = ['1', '2', '3', '4', '5'];
  else if (q.kind === 'nps') buckets = Array.from({ length: 11 }, (_, i) => String(i));
  else buckets = [...(q.options ?? [])];

  const tally = new Map<string, number>(buckets.map((b) => [b, 0]));
  for (const r of answered) {
    const v = r.answers[q.key];
    const vals = Array.isArray(v) ? v : [v];
    for (const x of vals) {
      const k = String(x);
      if (tally.has(k)) tally.set(k, (tally.get(k) ?? 0) + 1);
    }
  }
  const max = Math.max(1, ...Array.from(tally.values()));
  const n = answered.length;

  return (
    <div className="border border-navy-border bg-navy-deep p-3">
      <div className="text-sm text-white mb-2">
        {q.label} <span className="text-text-muted">· {n} answered{q.kind === 'multi' ? ' · pick all' : ''}</span>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {buckets.map((b) => {
            const c = tally.get(b) ?? 0;
            return (
              <tr key={b} title={`${b}: ${c} (${pct(c, n)})`}>
                <td className="py-0.5 pr-3 text-text-body whitespace-nowrap w-1/3 align-middle">{b}</td>
                <td className="py-0.5 align-middle">
                  <div className="h-3 bg-navy-border/40">
                    <div className="h-3 bg-gold" style={{ width: `${(c / max) * 100}%` }} />
                  </div>
                </td>
                <td className="py-0.5 pl-3 text-right text-text-body whitespace-nowrap w-20 align-middle tabular-nums">
                  {c} · {pct(c, n)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
