-- Expand collection statuses for cellar-style tracking.
-- Existing values remain valid; new app versions can mark teas as owned,
-- finished, or worth buying again.

ALTER TABLE user_teas
  DROP CONSTRAINT IF EXISTS user_teas_status_check;

ALTER TABLE user_teas
  ADD CONSTRAINT user_teas_status_check
  CHECK (status IN ('tried', 'want_to_try', 'owned', 'finished', 'buy_again'));
