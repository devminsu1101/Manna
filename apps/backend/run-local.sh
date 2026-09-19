#!/usr/bin/env bash
# 로컬 백엔드 기동. .env의 시크릿을 환경변수로 올린 뒤 bootRun.
# 사전 조건: apps/에서 `docker compose up -d` (Postgres 5432).
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo "❌ .env가 없다. GOOGLE_CLIENT_ID/SECRET을 채운 .env를 만들어라."; exit 1; }
set -a; source .env; set +a

: "${GOOGLE_CLIENT_ID:?.env의 GOOGLE_CLIENT_ID가 비어 있다}"
: "${GOOGLE_CLIENT_SECRET:?.env의 GOOGLE_CLIENT_SECRET이 비어 있다}"

exec ./gradlew bootRun
