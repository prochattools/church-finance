#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME=$1
if [ -z "$PROJECT_NAME" ]; then
  echo "❌ Usage: $0 <project-name>"
  exit 1
fi

echo "--------------------------------------------------"
echo "🚀 Provisioning Supabase project: $PROJECT_NAME"
echo "Triggered at: $(date)"
echo "--------------------------------------------------"

# Create new Supabase project
supabase projects create "$PROJECT_NAME" --org-id your-org-id --region eu-west-1

# Get project ref
PROJECT_REF=$(supabase projects list --json | jq -r ".[] | select(.name==\"$PROJECT_NAME\") | .id")

if [ -z "$PROJECT_REF" ]; then
  echo "❌ Failed to get Supabase project ref"
  exit 1
fi

# Rotate DB password
DB_PASSWORD=$(openssl rand -base64 32)
supabase db reset --project-ref "$PROJECT_REF" --password "$DB_PASSWORD"

DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo "✅ Supabase project created"
echo "Project Ref: $PROJECT_REF"
echo "Database Host: db.${PROJECT_REF}.supabase.co"
echo "Database URL generated and injected to Dokploy (password hidden)."

# Send to Dokploy if webhook is available
if [ -n "${DOKPLOY_WEBHOOK:-}" ]; then
  curl -X POST "$DOKPLOY_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"project\":\"$PROJECT_NAME\",\"DATABASE_URL\":\"$DATABASE_URL\"}"
  echo "🔗 DATABASE_URL sent to Dokploy"
fi

echo "--------------------------------------------------"
