#!/usr/bin/env bash
set -euo pipefail
PR_NUMBER=$1
PROJECT_NAME="boilerplate-pr-${PR_NUMBER}"
./scripts/cleanup-preview.sh "$PROJECT_NAME"
