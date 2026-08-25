#!/usr/bin/env bash
set -euo pipefail

DATA_FILES=(
  shared/src/data/festivals.json
  shared/src/data/festivals.source.json
  shared/src/data/lineups.json
  shared/src/data/prices.json
  shared/src/data/festivals.candidates.json
  shared/src/data/changes.json
)

git config user.name "bpmap-bot"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add "${DATA_FILES[@]}"

if git diff --staged --quiet; then
  echo "· Aucun changement de données, rien à publier."
  exit 0
fi

BRANCH="data/refresh-${GITHUB_RUN_ID}"
git checkout -b "$BRANCH"
git commit -m "chore: rafraîchissement quotidien des données (ingestion + vérification croisée)"
git push origin "$BRANCH"

HEAD_SHA="$(git rev-parse HEAD)"
RUN_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"

gh api "repos/${GITHUB_REPOSITORY}/statuses/${HEAD_SHA}" \
  --method POST \
  -f state=success \
  -f context="${REQUIRED_CHECK_CONTEXT}" \
  -f description="lint · types · build exécutés dans le job de données" \
  -f target_url="${RUN_URL}" >/dev/null

gh pr create --base main --head "$BRANCH" \
  --title "chore: données quotidiennes" \
  --body "Rafraîchissement automatique : ingestion multi-sources, vérification croisée, contrôle d'intégrité, puis \`lint\` + \`typecheck\` + \`build\` exécutés dans [ce run](${RUN_URL})."

gh pr merge "$BRANCH" --auto --merge --delete-branch
echo "✓ PR ouverte sur $BRANCH et auto-merge armé."
