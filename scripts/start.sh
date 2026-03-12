#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RUN_DIR="$ROOT_DIR/.run"
PID_DIR="$RUN_DIR/pids"
LOG_DIR="$RUN_DIR/logs"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
BACKEND_LOG_FILE="$LOG_DIR/backend.log"
FRONTEND_LOG_FILE="$LOG_DIR/frontend.log"
DETACHER="$ROOT_DIR/scripts/run_detached.py"

mkdir -p "$PID_DIR" "$LOG_DIR"

is_running() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
      return 0
    fi
    rm -f "$pid_file"
  fi
  return 1
}

require_file() {
  local path="$1"
  local message="$2"
  if [[ ! -e "$path" ]]; then
    echo "$message"
    exit 1
  fi
}

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Missing required command: $name"
    exit 1
  fi
}

if is_running "$BACKEND_PID_FILE" || is_running "$FRONTEND_PID_FILE"; then
  echo "CaipuCodex seems to already be running. Use ./scripts/stop.sh first if needed."
  exit 1
fi

require_file "$ROOT_DIR/.env" "Missing $ROOT_DIR/.env. Copy .env.example first."
require_file "$BACKEND_DIR/.venv/bin/python" "Missing backend virtualenv. Create it under backend/.venv first."
require_file "$FRONTEND_DIR/package.json" "Missing frontend package.json."
require_file "$FRONTEND_DIR/node_modules" "Missing frontend/node_modules. Run npm install in frontend first."
require_file "$DETACHER" "Missing $DETACHER"
require_command nohup

echo "Running database migrations..."
MIGRATION_LOG="$LOG_DIR/migration.log"
set +e
(
  cd "$BACKEND_DIR"
  PYTHONPATH=. .venv/bin/alembic upgrade head
) >"$MIGRATION_LOG" 2>&1
MIGRATION_EXIT=$?
set -e

if [[ $MIGRATION_EXIT -ne 0 ]]; then
  if rg -q "DuplicateTable|already exists" "$MIGRATION_LOG"; then
    echo "Detected existing schema without Alembic stamp; stamping current database to head..."
    (
      cd "$BACKEND_DIR"
      PYTHONPATH=. .venv/bin/alembic stamp head
    ) >>"$MIGRATION_LOG" 2>&1
  else
    cat "$MIGRATION_LOG"
    echo "Database migration failed. Check $MIGRATION_LOG"
    exit 1
  fi
fi

echo "Starting backend in background..."
python3 "$DETACHER" "$BACKEND_PID_FILE" "$BACKEND_LOG_FILE" "$BACKEND_DIR" env PYTHONPATH=. .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000

sleep 1

if ! is_running "$BACKEND_PID_FILE"; then
  echo "Backend failed to start. Check $BACKEND_LOG_FILE"
  exit 1
fi

echo "Starting frontend in background..."
python3 "$DETACHER" "$FRONTEND_PID_FILE" "$FRONTEND_LOG_FILE" "$FRONTEND_DIR" npm run dev -- --host 127.0.0.1 --port 5173 --strictPort

sleep 1

if ! is_running "$FRONTEND_PID_FILE"; then
  echo "Frontend failed to start. Check $FRONTEND_LOG_FILE"
  exit 1
fi

echo "CaipuCodex started successfully."
echo "- Frontend: http://127.0.0.1:5173"
echo "- Backend:  http://127.0.0.1:8000"
echo "- Health:   http://127.0.0.1:8000/health"
echo "- Logs:     $LOG_DIR"
