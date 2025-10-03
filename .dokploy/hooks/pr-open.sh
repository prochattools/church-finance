#!/usr/bin/env bash
set -euo pipefail
PR_NUMBER=$1
PROJECT_NAME="boilerplate-pr-${PR_NUMBER}"
./scripts/provision-saas.sh "$PROJECT_NAME"
