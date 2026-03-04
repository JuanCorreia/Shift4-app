#!/bin/sh
set -e

echo "Starting Shift4 Hospitality App..."
echo "Waiting for database to be ready..."

# Simple TCP check for PostgreSQL (port 5432 on db host)
until node -e "
  const net = require('net');
  const sock = new net.Socket();
  sock.setTimeout(2000);
  sock.connect(5432, 'db', () => { sock.destroy(); process.exit(0); });
  sock.on('error', () => process.exit(1));
  sock.on('timeout', () => { sock.destroy(); process.exit(1); });
" 2>/dev/null; do
  echo "  DB not ready yet, retrying in 2s..."
  sleep 2
done

echo "Database is ready!"

exec "$@"
