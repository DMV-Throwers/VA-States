-- ─────────────────────────────────────────────────────────────────────────────
-- SBJ (Sport / Beginner / Junior) uses a /20-per-category eval scale
-- (Total Eval /80: TP+PQ+MS+RC each out of 20), not the /10-per-category
-- scale 1A/X use (Total Eval /40). Migration 0014 hardcoded 0-10 as a
-- division-agnostic check constraint on all four eval columns, which would
-- reject any real SBJ score above 10 -- not just this import's data, any
-- future judge scoring an SBJ competitor through the live clicker UI would
-- hit the same wall. Make the cap division-aware instead.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE vsyc_scores DROP CONSTRAINT IF EXISTS vsyc_scores_trick_presentation_check;
ALTER TABLE vsyc_scores DROP CONSTRAINT IF EXISTS vsyc_scores_performance_quality_check;
ALTER TABLE vsyc_scores DROP CONSTRAINT IF EXISTS vsyc_scores_musicality_check;
ALTER TABLE vsyc_scores DROP CONSTRAINT IF EXISTS vsyc_scores_routine_construction_check;

ALTER TABLE vsyc_scores
  ADD CONSTRAINT vsyc_scores_trick_presentation_check
    CHECK (trick_presentation >= 0 AND trick_presentation <= (CASE WHEN division = 'SBJ' THEN 20 ELSE 10 END)),
  ADD CONSTRAINT vsyc_scores_performance_quality_check
    CHECK (performance_quality >= 0 AND performance_quality <= (CASE WHEN division = 'SBJ' THEN 20 ELSE 10 END)),
  ADD CONSTRAINT vsyc_scores_musicality_check
    CHECK (musicality >= 0 AND musicality <= (CASE WHEN division = 'SBJ' THEN 20 ELSE 10 END)),
  ADD CONSTRAINT vsyc_scores_routine_construction_check
    CHECK (routine_construction >= 0 AND routine_construction <= (CASE WHEN division = 'SBJ' THEN 20 ELSE 10 END));
