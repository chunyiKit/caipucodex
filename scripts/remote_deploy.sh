#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  remote_deploy.sh <source_dir> [target_dir]

Example:
  remote_deploy.sh /tmp/caipucodex-deploy-20260312-120000 /srv/caipucodex

This script is intended to be called by scripts/deploy_remote.sh on the remote server.
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

SOURCE_DIR="$1"
TARGET_DIR="${2:-/srv/caipucodex}"

BACKEND_DIR="$TARGET_DIR/backend"
FRONTEND_DIR="$TARGET_DIR/frontend"
RUN_DIR="$TARGET_DIR/.run"
LOG_DIR="$RUN_DIR/logs"
MIGRATION_LOG="$LOG_DIR/migration.log"
CURRENT_USER="$(id -un)"
CURRENT_GROUP="$(id -gn)"
DEPLOY_SUDO_PASSWORD="${DEPLOY_SUDO_PASSWORD:-}"

log() {
  printf '==> %s\n' "$1"
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

run_sudo() {
  if command -v sudo >/dev/null 2>&1; then
    if [[ -n "$DEPLOY_SUDO_PASSWORD" ]]; then
      printf '%s\n' "$DEPLOY_SUDO_PASSWORD" | sudo -S -p '' "$@"
    else
      sudo "$@"
    fi
  else
    "$@"
  fi
}

require_command() {
  local name="$1"
  command -v "$name" >/dev/null 2>&1 || fail "Missing required command: $name"
}

pick_python() {
  if command -v python3.11 >/dev/null 2>&1; then
    command -v python3.11
    return
  fi
  if command -v python3 >/dev/null 2>&1; then
    command -v python3
    return
  fi
  fail "python3.11 or python3 is required on the remote server"
}

ensure_rsync() {
  if command -v rsync >/dev/null 2>&1; then
    return
  fi
  log "Installing rsync"
  run_sudo apt-get update
  run_sudo apt-get install -y rsync
}

load_env_file() {
  local env_file="$1"
  if [[ -f "$env_file" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      line="${line%$'\r'}"
      [[ -z "$line" ]] && continue
      [[ "$line" =~ ^[[:space:]]*# ]] && continue

      local key="${line%%=*}"
      local value="${line#*=}"

      key="${key#"${key%%[![:space:]]*}"}"
      key="${key%"${key##*[![:space:]]}"}"

      [[ -z "$key" ]] && continue
      export "$key=$value"
    done <"$env_file"
  fi
}

restart_backend() {
  if run_sudo systemctl cat caipucodex.service >/dev/null 2>&1; then
    log "Restarting caipucodex.service"
    run_sudo systemctl restart caipucodex.service
    return
  fi

  if run_sudo systemctl cat caipucodex-backend.service >/dev/null 2>&1; then
    log "Restarting caipucodex-backend.service"
    run_sudo systemctl restart caipucodex-backend.service
    return
  fi

  if [[ -x "$TARGET_DIR/scripts/stop.sh" && -x "$TARGET_DIR/scripts/start.sh" ]]; then
    log "Restarting app with project scripts"
    bash "$TARGET_DIR/scripts/stop.sh" || true
    bash "$TARGET_DIR/scripts/start.sh"
    return
  fi

  fail "No backend restart method found. Expected systemd service or scripts/start.sh"
}

reload_nginx() {
  if ! command -v nginx >/dev/null 2>&1; then
    fail "nginx is not installed on the remote server"
  fi

  log "Reloading nginx"
  run_sudo nginx -t
  run_sudo systemctl reload nginx
}

require_command tar
require_command npm
ensure_rsync

PYTHON_BIN="$(pick_python)"

log "Ensuring target directories exist"
run_sudo mkdir -p "$TARGET_DIR" "$LOG_DIR" "$RUN_DIR/pids" "$BACKEND_DIR/uploads"

log "Syncing source to $TARGET_DIR"
run_sudo rsync -a --delete \
  --exclude '.env' \
  --exclude '.run' \
  --exclude 'backend/.venv' \
  --exclude 'backend/uploads' \
  --exclude 'backend/caipucodex.db' \
  --exclude 'backend/tests/test.db' \
  "$SOURCE_DIR"/ "$TARGET_DIR"/

run_sudo chown -R "$CURRENT_USER:$CURRENT_GROUP" "$TARGET_DIR"

if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
  log "Creating backend virtual environment"
  "$PYTHON_BIN" -m venv "$BACKEND_DIR/.venv"
fi

log "Installing backend dependencies"
"$BACKEND_DIR/.venv/bin/python" -m pip install --upgrade pip
"$BACKEND_DIR/.venv/bin/python" -m pip install -r "$BACKEND_DIR/requirements.txt"

log "Installing frontend dependencies"
(cd "$FRONTEND_DIR" && npm ci)

log "Building frontend"
(
  cd "$FRONTEND_DIR"
  load_env_file "$TARGET_DIR/.env"
  npm run build
)

log "Running backend migrations"
set +e
(
  cd "$BACKEND_DIR"
  load_env_file "$TARGET_DIR/.env"
  PYTHONPATH=. .venv/bin/alembic upgrade head
) >"$MIGRATION_LOG" 2>&1
MIGRATION_EXIT=$?
set -e

if [[ $MIGRATION_EXIT -ne 0 ]]; then
  if grep -Eq 'DuplicateTable|already exists' "$MIGRATION_LOG"; then
    log "Schema exists without Alembic stamp; stamping head"
    (
      cd "$BACKEND_DIR"
      load_env_file "$TARGET_DIR/.env"
      PYTHONPATH=. .venv/bin/alembic stamp head
    ) >>"$MIGRATION_LOG" 2>&1
  else
    cat "$MIGRATION_LOG"
    fail "Database migration failed"
  fi
fi

restart_backend
reload_nginx

log "Remote deploy completed"
