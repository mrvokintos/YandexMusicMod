#!/usr/bin/env bash
set -euo pipefail

cd /workspace
marker=$(mktemp)
trap 'rm -f "$marker"' EXIT

bun install --frozen-lockfile
bun start

mapfile -d '' archives < <(find .versions -type f -name '*.zip' -newer "$marker" -print0)
if ((${#archives[@]} == 0)); then
  echo 'No Linux ZIP was produced' >&2
  exit 1
fi

for archive in "${archives[@]}"; do
  python3 scripts/linux/verify_release.py "$archive"
done
