#!/bin/sh

set -e

DB_HOST="$1"
DB_PORT="$2"
shift 2
DB_CMD="$@"

until nc -z "$DB_HOST" "$DB_PORT"; do
  >&2 echo "Waiting for $DB_HOST:$DB_PORT to be available..."
  sleep 1
done

>&2 echo "$DB_HOST:$DB_PORT is available - Executing command: $DB_CMD"
exec $DB_CMD
