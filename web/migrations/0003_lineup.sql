-- Partial / headline lineup per festival (artist names). Powers the artist
-- filter. Safe to re-run.
alter table festivals add column if not exists lineup text[];
