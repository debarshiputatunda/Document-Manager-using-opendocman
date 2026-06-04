#!/usr/bin/env bash

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$APP_ROOT/frontend"
BACKEND_DIR="$APP_ROOT/backend"
DEFAULT_STORAGE_DIR="$(cd "$APP_ROOT/.." && pwd)/document-storage"
SCHEMA_PATH="$APP_ROOT/database_schema.sql"
INSTALL_HELP="$APP_ROOT/install.txt"

DB_HOST="${APP_DB_HOST:-localhost}"
DB_NAME="${APP_DB_NAME:-opendocman}"
DB_USER="${APP_DB_USER:-odmuser}"
DB_PASS="${APP_DB_PASS:-odm123}"
STORAGE_DIR="${ODM_STORAGE_DIR:-$DEFAULT_STORAGE_DIR}"
INSTALL_FRONTEND="yes"
BUILD_FRONTEND="yes"
UPDATE_ODM_DATADIR="yes"
ASSUME_YES="no"

print_usage() {
  cat <<'USAGE'
Usage:
  ./setup-new-machine.sh [options]

Options:
  --db-host HOST             MySQL host. Default: localhost
  --db-name NAME             MySQL database. Default: opendocman
  --db-user USER             MySQL user. Default: odmuser
  --db-pass PASS             MySQL password. Default: odm123
  --schema PATH              Fresh database schema file. Default: database_schema.sql
  --storage-dir PATH         Document storage directory. Default: ../document-storage
  --skip-frontend-install    Do not run npm install/npm ci.
  --skip-build               Do not run npm run build.
  --update-odm-datadir       Update odm_settings.dataDir to the storage directory.
  --skip-odm-datadir         Do not update odm_settings.dataDir.
  -y, --yes                  Answer yes to prompts.
  -h, --help                 Show this help.

Examples:
  ./setup-new-machine.sh
  ./setup-new-machine.sh --schema database_schema.sql
  ./setup-new-machine.sh --storage-dir /var/document-storage --update-odm-datadir

Fresh database behavior:
  This script imports database_schema.sql by default. It does not import
  opendocman_backup.sql or carry data from the original machine.
USAGE
}

log() {
  printf '\n==> %s\n' "$1"
}

warn() {
  printf 'Warning: %s\n' "$1" >&2
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  printf 'See install instructions: %s\n' "$INSTALL_HELP" >&2
  exit 1
}

confirm() {
  local prompt="$1"

  if [[ "$ASSUME_YES" == "yes" ]]; then
    return 0
  fi

  read -r -p "$prompt [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" || "$answer" == "yes" || "$answer" == "YES" ]]
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    return 1
  fi

  return 0
}

check_required_commands() {
  local missing=()
  local command_name

  for command_name in php node npm mysql; do
    if ! require_command "$command_name"; then
      missing+=("$command_name")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    printf 'Error: Missing required command(s): %s\n' "${missing[*]}" >&2
    printf 'Install the missing software and ensure it is available in PATH.\n' >&2
    printf 'See install instructions: %s\n' "$INSTALL_HELP" >&2
    exit 1
  fi
}

run_mysql() {
  local args=(-h "$DB_HOST" -u "$DB_USER")

  if [[ -n "$DB_PASS" ]]; then
    args+=("-p$DB_PASS")
  fi

  mysql "${args[@]}" "$@"
}

quote_sql_string() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\'/\\\'}"
  printf "'%s'" "$value"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --db-host)
      DB_HOST="${2:-}"
      shift 2
      ;;
    --db-name)
      DB_NAME="${2:-}"
      shift 2
      ;;
    --db-user)
      DB_USER="${2:-}"
      shift 2
      ;;
    --db-pass)
      DB_PASS="${2:-}"
      shift 2
      ;;
    --schema)
      SCHEMA_PATH="${2:-}"
      shift 2
      ;;
    --storage-dir)
      STORAGE_DIR="${2:-}"
      shift 2
      ;;
    --skip-frontend-install)
      INSTALL_FRONTEND="no"
      shift
      ;;
    --skip-build)
      BUILD_FRONTEND="no"
      shift
      ;;
    --update-odm-datadir)
      UPDATE_ODM_DATADIR="yes"
      shift
      ;;
    --skip-odm-datadir)
      UPDATE_ODM_DATADIR="no"
      shift
      ;;
    -y|--yes)
      ASSUME_YES="yes"
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      ;;
  esac
done

[[ -d "$FRONTEND_DIR" ]] || fail "frontend directory not found at $FRONTEND_DIR"
[[ -d "$BACKEND_DIR" ]] || fail "backend directory not found at $BACKEND_DIR"

[[ -f "$SCHEMA_PATH" ]] || fail "Fresh schema file not found: $SCHEMA_PATH"

log "Checking required tools"
check_required_commands

php -v | head -n 1
node -v
npm -v
mysql --version

log "Preparing document storage"
mkdir -p "$STORAGE_DIR"
[[ -d "$STORAGE_DIR" ]] || fail "Storage directory could not be created: $STORAGE_DIR"
[[ -r "$STORAGE_DIR" ]] || fail "Storage directory is not readable: $STORAGE_DIR"
[[ -w "$STORAGE_DIR" ]] || fail "Storage directory is not writable: $STORAGE_DIR"
printf 'Storage directory: %s\n' "$STORAGE_DIR"

log "Checking MySQL connection"
if ! run_mysql -e "SELECT 1;" >/dev/null; then
  fail "Could not connect to MySQL with user '$DB_USER' on host '$DB_HOST'. Start MySQL and verify DB credentials."
fi

log "Preparing fresh database"
existing_db="$(run_mysql -N -B -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DB_NAME';" || true)"

if [[ "$existing_db" == "$DB_NAME" ]]; then
  if confirm "Database '$DB_NAME' already exists. Drop and recreate it as a fresh database? This deletes existing data."; then
    run_mysql -e "DROP DATABASE \`$DB_NAME\`;"
  else
    fail "Fresh database setup cancelled."
  fi
fi

run_mysql -e "CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

log "Importing fresh schema"
run_mysql "$DB_NAME" < "$SCHEMA_PATH"

log "Verifying required database tables"
required_tables=(app_documents odm_data odm_settings)
for table in "${required_tables[@]}"; do
  if ! run_mysql "$DB_NAME" -e "SHOW TABLES LIKE '$table';" | grep -q "$table"; then
    warn "Required table '$table' was not found in database '$DB_NAME'. Check the schema file before running the app."
  fi
done

should_update_datadir="no"
if [[ "$UPDATE_ODM_DATADIR" == "yes" ]]; then
  should_update_datadir="yes"
elif [[ "$UPDATE_ODM_DATADIR" == "prompt" ]] && confirm "Update OpenDocMan odm_settings.dataDir to '$STORAGE_DIR/'?"; then
  should_update_datadir="yes"
fi

if [[ "$should_update_datadir" == "yes" ]]; then
  log "Updating OpenDocMan dataDir setting"
  storage_value="$(quote_sql_string "$STORAGE_DIR/")"
  run_mysql "$DB_NAME" -e "UPDATE odm_settings SET value = $storage_value WHERE name = 'dataDir';"
else
  log "Leaving OpenDocMan dataDir unchanged"
fi

if [[ "$INSTALL_FRONTEND" == "yes" ]]; then
  log "Installing frontend dependencies"
  cd "$FRONTEND_DIR"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi

  if [[ "$BUILD_FRONTEND" == "yes" ]]; then
    log "Building frontend"
    npm run build
  else
    log "Skipping frontend build"
  fi
else
  log "Skipping frontend dependency install"
fi

log "Setup complete"
cat <<EOF

Use these commands to run the application locally:

  cd "$APP_ROOT"
  APP_DB_HOST="$DB_HOST" APP_DB_NAME="$DB_NAME" APP_DB_USER="$DB_USER" APP_DB_PASS="$DB_PASS" ODM_STORAGE_DIR="$STORAGE_DIR" php -S localhost:8000 -t backend

In a second terminal:

  cd "$FRONTEND_DIR"
  npm run dev

Open:

  http://127.0.0.1:5173/

Notes:
- This script creates a fresh database from "$SCHEMA_PATH".
- It does not import opendocman_backup.sql or carry local document data.
- Keep document-storage files in sync with odm_data IDs.
- Files are stored as <odm_data.id>.dat.
- The custom app uses app_documents.odm_document_id -> odm_data.id.
EOF
