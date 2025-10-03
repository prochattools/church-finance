#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME=$1
if [ -z "$PROJECT_NAME" ]; then
  echo "❌ Usage: $0 <project-name>"
  exit 1
fi

echo "--------------------------------------------------"
echo "🧹 Cleaning up Supabase project: $PROJECT_NAME"
echo "Triggered at: $(date)"
echo "--------------------------------------------------"

PROJECT_REF=$(supabase projects list --json | jq -r ".[] | select(.name==\"$PROJECT_NAME\") | .id")

if [ -n "$PROJECT_REF" ]; then
  supabase projects delete "$PROJECT_REF" --confirm
  echo "✅ Deleted Supabase project"
  echo "Project Ref: $PROJECT_REF"
else
  echo "⚠️ No Supabase project found for $PROJECT_NAME"
fi

echo "--------------------------------------------------"
