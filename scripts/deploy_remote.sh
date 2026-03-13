#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOTE_HOST="${DEPLOY_HOST:-122.51.81.235}"
REMOTE_PORT="${DEPLOY_PORT:-22}"
REMOTE_USER="${DEPLOY_USER:-ubuntu}"
REMOTE_PATH="${DEPLOY_PATH:-/srv/caipucodex}"
DEPLOY_PASSWORD="${DEPLOY_PASSWORD:-}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE_NAME="caipucodex-deploy-${TIMESTAMP}.tar.gz"
REMOTE_ARCHIVE="/tmp/${ARCHIVE_NAME}"
REMOTE_STAGE_DIR="/tmp/caipucodex-deploy-${TIMESTAMP}"

SSH_OPTS=(
  -p "$REMOTE_PORT"
  -o StrictHostKeyChecking=accept-new
  -o UserKnownHostsFile="$HOME/.ssh/known_hosts"
)

SCP_OPTS=(
  -P "$REMOTE_PORT"
  -o StrictHostKeyChecking=accept-new
  -o UserKnownHostsFile="$HOME/.ssh/known_hosts"
)

log() {
  printf '==> %s\n' "$1"
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

require_command() {
  local name="$1"
  command -v "$name" >/dev/null 2>&1 || fail "Missing required command: $name"
}

cleanup() {
  [[ -n "${ASKPASS_SCRIPT:-}" && -f "${ASKPASS_SCRIPT:-}" ]] && rm -f "$ASKPASS_SCRIPT"
  [[ -n "${TMP_DIR:-}" && -d "${TMP_DIR:-}" ]] && rm -rf "$TMP_DIR"
}

trap cleanup EXIT

require_command tar
require_command ssh
require_command scp

if [[ -z "$DEPLOY_PASSWORD" ]]; then
  read -r -s -p "Remote password for ${REMOTE_USER}@${REMOTE_HOST}: " DEPLOY_PASSWORD
  printf '\n'
fi

TMP_DIR="$(mktemp -d)"
ARCHIVE_PATH="$TMP_DIR/$ARCHIVE_NAME"
ASKPASS_SCRIPT="$TMP_DIR/ssh-askpass.sh"

cat >"$ASKPASS_SCRIPT" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$DEPLOY_PASSWORD"
EOF
chmod 700 "$ASKPASS_SCRIPT"

log "Packing source archive"
COPYFILE_DISABLE=1 tar \
  --exclude='.git' \
  --exclude='.artifacts' \
  --exclude='.run' \
  --exclude='backend/.venv' \
  --exclude='backend/__pycache__' \
  --exclude='backend/.pytest_cache' \
  --exclude='frontend/node_modules' \
  --exclude='frontend/dist' \
  --exclude='frontend/*.tsbuildinfo' \
  --exclude='frontend.tar.gz' \
  -czf "$ARCHIVE_PATH" \
  -C "$ROOT_DIR" \
  .env.example \
  .gitignore \
  README.md \
  backend \
  docs \
  frontend \
  scripts

run_with_askpass() {
  env \
    DEPLOY_PASSWORD="$DEPLOY_PASSWORD" \
    SSH_ASKPASS="$ASKPASS_SCRIPT" \
    SSH_ASKPASS_REQUIRE=force \
    DISPLAY="${DISPLAY:-dummy:0}" \
    "$@"
}

log "Uploading archive to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ARCHIVE}"
run_with_askpass scp "${SCP_OPTS[@]}" "$ARCHIVE_PATH" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ARCHIVE}"

log "Running remote deploy"
run_with_askpass ssh "${SSH_OPTS[@]}" "${REMOTE_USER}@${REMOTE_HOST}" \
  "export DEPLOY_SUDO_PASSWORD=$(printf '%q' "$DEPLOY_PASSWORD"); \
   export DEPLOY_TARGET_PATH=$(printf '%q' "$REMOTE_PATH"); \
   export DEPLOY_ARCHIVE_PATH=$(printf '%q' "$REMOTE_ARCHIVE"); \
   export DEPLOY_STAGE_DIR=$(printf '%q' "$REMOTE_STAGE_DIR"); \
   bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

cleanup_remote() {
  rm -rf "$DEPLOY_STAGE_DIR" "$DEPLOY_ARCHIVE_PATH"
}

trap cleanup_remote EXIT

mkdir -p "$DEPLOY_STAGE_DIR"
tar -xzf "$DEPLOY_ARCHIVE_PATH" -C "$DEPLOY_STAGE_DIR"
bash "$DEPLOY_STAGE_DIR/scripts/remote_deploy.sh" "$DEPLOY_STAGE_DIR" "$DEPLOY_TARGET_PATH"
REMOTE_SCRIPT

log "Deploy finished"
