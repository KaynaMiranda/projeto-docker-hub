#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set"
  exit 1
fi

echo "Waiting for database..."
node ./src/scripts/wait-for-db.js

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npm run prisma:generate

echo "Running migrations..."
npm run prisma:migrate:deploy

echo "Starting backend..."
exec npm run dev

