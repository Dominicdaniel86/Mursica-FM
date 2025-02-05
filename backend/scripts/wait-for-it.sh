#!/bin/sh

set -e

HOST="$1"
PORT="$2"
shift 2
CMD="$@"

until nc -z "$HOST" "$PORT"; do
  >&2 echo "Waiting for $HOST:$PORT to be available..."
  sleep 1
done

>&2 echo "$HOST:$PORT is available - Executing command: $CMD"
exec $CMD
