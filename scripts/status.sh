#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
PID_DIR="$RUN_DIR/pids"
LOG_DIR="$RUN_DIR/logs"

BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
BACKEND_LOG_FILE="$LOG_DIR/backend.log"
FRONTEND_LOG_FILE="$LOG_DIR/frontend.log"

print_header() {
  local title="$1"
  printf '\n== %s ==\n' "$title"
}

is_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1
}

read_pid() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    cat "$pid_file"
  fi
}

port_status() {
  local port="$1"
  if lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "listening"
  else
    echo "not listening"
  fi
}

show_service_status() {
  local name="$1"
  local pid_file="$2"
  local port="$3"
  local log_file="$4"

  local pid
  pid="$(read_pid "$pid_file")"

  print_header "$name"

  if [[ -z "$pid" ]]; then
    echo "status: stopped"
  elif is_running "$pid"; then
    echo "status: running"
    echo "pid: $pid"
  else
    echo "status: stale pid file"
    echo "pid file: $pid_file"
  fi

  echo "port $port: $(port_status "$port")"
  echo "log: $log_file"

  if [[ -f "$log_file" ]]; then
    echo "last log lines:"
    tail -n 10 "$log_file"
  else
    echo "last log lines: (no log file yet)"
  fi
}

echo "CaipuCodex status"
echo "root: $ROOT_DIR"

show_service_status "Backend" "$BACKEND_PID_FILE" "8000" "$BACKEND_LOG_FILE"
show_service_status "Frontend" "$FRONTEND_PID_FILE" "5173" "$FRONTEND_LOG_FILE"

