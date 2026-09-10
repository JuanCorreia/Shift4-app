#!/bin/sh
# Runs once by the Postgres image on an EMPTY data volume (docker-entrypoint-initdb.d).
# Creates the first team invite code (bcrypt-hashed via pgcrypto) and the first
# admin user from environment variables. Refuses to run with a weak/absent code.
set -e

if [ -z "${SEED_ADMIN_EMAIL:-}" ] || [ -z "${SEED_INVITE_CODE:-}" ]; then
  echo "[seed] SEED_ADMIN_EMAIL / SEED_INVITE_CODE not set - skipping admin seed."
  echo "[seed] Create the first admin later with: docker compose exec -e SEED_ADMIN_EMAIL=... -e SEED_INVITE_CODE=... db sh /docker-entrypoint-initdb.d/20-seed.sh"
  exit 0
fi

if [ "${#SEED_INVITE_CODE}" -lt 16 ]; then
  echo "[seed] ERROR: SEED_INVITE_CODE must be at least 16 characters." >&2
  exit 1
fi

case "$SEED_INVITE_CODE" in
  *shift4team*|*password*|*changeme*|*secret*|*123456*|*qwerty*)
    echo "[seed] ERROR: SEED_INVITE_CODE is a well-known/weak value. Refusing to seed." >&2
    exit 1
    ;;
esac

case "$SEED_ADMIN_EMAIL" in
  *@*.*) ;;
  *)
    echo "[seed] ERROR: SEED_ADMIN_EMAIL does not look like an e-mail address." >&2
    exit 1
    ;;
esac

psql -v ON_ERROR_STOP=1 \
  --username "${POSTGRES_USER:-postgres}" --dbname "${POSTGRES_DB:-postgres}" \
  -v code="$SEED_INVITE_CODE" \
  -v email="$SEED_ADMIN_EMAIL" \
  -v name="${SEED_ADMIN_NAME:-Admin}" \
  -v team="${SEED_TEAM_NAME:-Default Team}" <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO team_settings (partner_id, invite_code, team_name)
SELECT id, crypt(:'code', gen_salt('bf', 10)), :'team'
FROM partners
WHERE slug = 'host'
  AND NOT EXISTS (SELECT 1 FROM team_settings WHERE team_settings.partner_id = partners.id);

INSERT INTO users (name, email, role, partner_id)
SELECT :'name', lower(:'email'), 'admin', id
FROM partners
WHERE slug = 'host'
ON CONFLICT (email) DO NOTHING;
SQL

echo "[seed] Admin user ${SEED_ADMIN_EMAIL} and hashed team invite code created."
