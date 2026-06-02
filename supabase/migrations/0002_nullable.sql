-- Relax NOT NULL constraints to match real-world data where capacity, size and
-- price are often unknown. Safe to re-run.
alter table festivals alter column capacity   drop not null;
alter table festivals alter column capacity   drop default;
alter table festivals alter column organizer  drop not null;
alter table festivals alter column size_tier  drop not null;
alter table festivals alter column price_full drop not null;
alter table festivals alter column start_date drop not null;
alter table festivals alter column end_date   drop not null;
