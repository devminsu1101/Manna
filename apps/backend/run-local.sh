#!/usr/bin/env bash
# 로컬 백엔드 기동. .env의 시크릿을 환경변수로 올린 뒤 bootRun.
# 사전 조건: apps/에서 `docker compose up -d` (호스트 포트는 apps/.env의 POSTGRES_PORT, 기본 5432).
set -euo pipefail
cd "$(dirname "$0")"

# macOS의 Homebrew JDK는 java_home에 등록되지 않을 수 있다.
# JAVA_HOME을 지정하지 않았다면 프로젝트가 요구하는 JDK 17을 찾아 사용한다.
if [[ -z "${JAVA_HOME:-}" && "$(uname -s)" == "Darwin" ]]; then
    java17_home="$(/usr/libexec/java_home -F -v 17 2>/dev/null || true)"
    if [[ -z "$java17_home" ]]; then
        for brew_prefix in /opt/homebrew /usr/local; do
            candidate="$brew_prefix/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
            if [[ -x "$candidate/bin/java" && -x "$candidate/bin/javac" ]]; then
                java17_home="$candidate"
                break
            fi
        done
    fi
    if [[ -n "$java17_home" ]]; then
        export JAVA_HOME="$java17_home"
    fi
fi

[ -f .env ] || { echo "❌ .env가 없다. GOOGLE_CLIENT_ID/SECRET을 채운 .env를 만들어라."; exit 1; }
set -a; source .env; set +a

: "${GOOGLE_CLIENT_ID:?.env의 GOOGLE_CLIENT_ID가 비어 있다}"
: "${GOOGLE_CLIENT_SECRET:?.env의 GOOGLE_CLIENT_SECRET이 비어 있다}"

exec ./gradlew bootRun
