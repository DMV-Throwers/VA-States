import { createAdminClient } from '@/lib/supabase/admin';
import { getEventFlagBoolean } from '@/lib/event-flags';
import { getSocialLinks, type Socials } from '@/lib/social-links';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// Public results are gated with an admin-toggleable flag and env fallback.

const DIVISIONS: { code: Division; label: string }[] = [
  { code: '1A',  label: '1A — Single String' },
  { code: 'X',   label: 'X Division' },
  { code: 'SBJ', label: 'Sport / Beginner / Junior' },
];

type Division = '1A' | 'X' | 'SBJ';

interface ResultRow {
  registration_id: string;
  division: string;
  display_name: string;
  city: string | null;
  state: string | null;
  final_score: number | string;
  socials: Socials | null;
}

interface Standing {
  registration_id: string;
  display_name: string;
  city: string | null;
  state: string | null;
  judge_count: number;
  avg_total: number;
  socials: Socials | null;
}

async function getStandings(): Promise<Record<Division, Standing[]>> {
  const empty: Record<Division, Standing[]> = { '1A': [], X: [], SBJ: [] };
  const supabase = createAdminClient();

  const { data, error } = await supabase.from('vsyc_results').select('*');
  if (error || !data) return empty;

  const grouped: Record<Division, Map<string, { s: Standing; sum: number }>> = {
    '1A': new Map(), X: new Map(), SBJ: new Map(),
  };

  for (const row of data as ResultRow[]) {
    const div = row.division as Division;
    if (!grouped[div]) continue;
    if (!grouped[div].has(row.registration_id)) {
      grouped[div].set(row.registration_id, {
        s: {
          registration_id: row.registration_id,
          display_name: row.display_name,
          city: row.city,
          state: row.state,
          judge_count: 0,
          avg_total: 0,
          socials: row.socials,
        },
        sum: 0,
      });
    }
    const entry = grouped[div].get(row.registration_id)!;
    entry.s.judge_count += 1;
    entry.sum += Number(row.final_score);
  }

  const result: Record<Division, Standing[]> = { '1A': [], X: [], SBJ: [] };
  for (const { code } of DIVISIONS) {
    for (const { s, sum } of grouped[code].values()) {
      s.avg_total = s.judge_count > 0 ? Math.round((sum / s.judge_count) * 100) / 100 : 0;
      result[code].push(s);
    }
    result[code].sort((a, b) => b.avg_total - a.avg_total);
  }
  return result;
}

// Refresh at most once per minute once published.
export const revalidate = 60;

const PLACE_COLORS = ['var(--gold)', '#c7c7d1', '#cd7f32']; // 1st gold · 2nd silver · 3rd bronze

/** Index of the highest-placed Virginia resident in a division's standings, or -1 if none. */
function vaChampionIndex(standings: Standing[]): number {
  return standings.findIndex((s) => s.state === 'VA');
}

export default async function ResultsPage() {
  const resultsPublished = await getEventFlagBoolean('results_published', process.env.RESULTS_PUBLISHED === 'true');
  const standings = resultsPublished ? await getStandings() : null;
  const total = standings
    ? Object.values(standings).reduce((s, arr) => s + arr.length, 0)
    : 0;

  const podium = standings
    ? DIVISIONS.flatMap(({ code }) => standings[code].slice(0, 3))
    : [];
  const podiumOutOfState = podium.filter((c) => c.state !== 'VA').length;

  return (
    <>
      <NavBar />
      <main id="main-content" style={{ maxWidth: 820, margin: '0 auto', padding: '3rem 1.5rem', minHeight: '60vh' }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', fontWeight: 800, color: 'var(--gold)', marginBottom: '0.5rem' }}>
            VSYC-26 · SEPT 19, 2026 · DULLES TOWN CENTER
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: '2rem', margin: '0 0 0.5rem' }}>
            Contest Results
          </h1>
          <p style={{ color: 'var(--text-body)', margin: 0 }}>
            {!resultsPublished
              ? 'Final standings will be posted here after the contest.'
              : total === 0
                ? 'Results are being finalized — check back shortly.'
                : 'Final standings, averaged across all judges.'}
          </p>
          <p style={{ color: 'var(--text-body)', margin: '0.5rem 0 0' }}>
            <a href="/results/run-order" style={{ color: 'var(--gold-light)' }}>See who&rsquo;s up next in the live run order →</a>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.25rem', marginTop: '0.75rem' }}>
            <a href="https://dmvthrowers.club/vsyc26-results.html" style={{ color: 'var(--gold-light)', fontSize: '0.85rem' }}>Full stats &amp; recap →</a>
            <a href="https://www.youtube.com/live/yVLew1sJqNA" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-light)', fontSize: '0.85rem' }}>Watch the livestream →</a>
            <a href="https://compete.yoyocontest.com/results/2026-virginia-state-yo-yo-contest" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-light)', fontSize: '0.85rem' }}>Official NYYL results →</a>
          </div>
        </header>

        {resultsPublished && total > 0 && podium.length > 0 && (
          <section style={{
            border: '1px solid var(--navy-border)', background: 'var(--navy)',
            padding: '1.25rem 1.5rem', marginBottom: '2.5rem', display: 'flex',
            alignItems: 'center', gap: '0.85rem',
          }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🗺️</span>
            <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', margin: 0 }}>
              <strong style={{ color: '#fff' }}>{podiumOutOfState} of {podium.length}</strong> podium spots across the three
              divisions went to out-of-state competitors. Each division&rsquo;s top Virginia finisher is marked{' '}
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>VA State Champion</span> below.
            </p>
          </section>
        )}

        {!resultsPublished || !standings ? (
          <section style={{ border: '1px solid var(--navy-border)', background: 'var(--navy)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏆</div>
            <p style={{ color: '#fff', fontWeight: 700, margin: '0 0 0.5rem' }}>
              Results drop right after the contest.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Competing on September 19? See who&rsquo;s registered on the{' '}
              <a href="/directory" style={{ color: 'var(--gold-light)' }}>directory page</a>.
            </p>
          </section>
        ) : (
          DIVISIONS.map(({ code, label }) => {
            const comps = standings[code];
            const vaIndex = vaChampionIndex(comps);
            return (
              <section key={code} style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--gold)', fontSize: '1.2rem', margin: 0 }}>
                    {label}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {comps.length} placed
                  </span>
                </div>

                {comps.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, paddingLeft: '1rem' }}>
                    No results for this division.
                  </p>
                ) : (
                  <div style={{ border: '1px solid var(--navy-border)' }}>
                    {comps.map((c, i) => {
                      const placeColor = i < 3 ? PLACE_COLORS[i] : 'var(--text-muted)';
                      return (
                        <div
                          key={c.registration_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.85rem 1rem',
                            borderBottom: i < comps.length - 1 ? '1px solid var(--navy-border)' : 'none',
                            background: i === 0 ? '#1a1400' : i % 2 === 0 ? 'var(--navy)' : 'transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                            <span style={{
                              width: '1.75rem', flexShrink: 0, textAlign: 'center',
                              fontSize: '0.95rem', fontWeight: 800, color: placeColor,
                            }}>
                              {i + 1}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              {i === 0 && (
                                <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.15rem' }}>
                                  🥇 DIVISION CHAMPION
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: i === 0 ? '1.15rem' : '0.95rem', fontWeight: 700, color: i === 0 ? 'var(--gold)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {c.display_name}
                                </span>
                                {i === vaIndex && (
                                  <span style={{
                                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em',
                                    color: 'var(--navy)', background: 'var(--gold)',
                                    padding: '0.15rem 0.4rem', borderRadius: 2, whiteSpace: 'nowrap',
                                  }}>
                                    VA STATE CHAMPION
                                  </span>
                                )}
                              </div>
                              {(c.city || c.state) && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  {[c.city, c.state].filter(Boolean).join(', ')}
                                </div>
                              )}
                              {getSocialLinks(c.socials).length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                                  {getSocialLinks(c.socials).map((l) => (
                                    <a
                                      key={l.platform}
                                      href={l.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.05em',
                                        textTransform: 'uppercase', padding: '0.2rem 0.5rem',
                                        border: '1px solid var(--gold)', color: 'var(--gold)', textDecoration: 'none',
                                      }}
                                    >
                                      {l.label} ↗
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <span style={{
                            fontFamily: 'monospace', fontWeight: 800,
                            fontSize: i === 0 ? '1.3rem' : '1.05rem', color: i === 0 ? 'var(--gold)' : '#fff',
                            flexShrink: 0, paddingLeft: '1rem',
                          }}>
                            {c.avg_total.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}

        <footer style={{ borderTop: '1px solid var(--navy-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            Scores are averaged across all judges. Questions about results?{' '}
            <a href="mailto:dmvthrowers@gmail.com" style={{ color: 'var(--gold-light)' }}>dmvthrowers@gmail.com</a>
          </p>
        </footer>
      </main>
      <Footer />
    </>
  );
}
