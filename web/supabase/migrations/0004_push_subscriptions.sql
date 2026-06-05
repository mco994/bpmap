-- Abonnements push Expo : un token d'appareil + la liste des suivis associés.
-- Alimenté par POST /api/push/register ; consommé par web/scripts/send-push.mjs.

create table if not exists push_subscriptions (
  token       text primary key,
  favorites   jsonb not null default '[]'::jsonb,
  platform    text,
  updated_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_updated_at_idx
  on push_subscriptions (updated_at);
