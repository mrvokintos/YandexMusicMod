#!/usr/bin/env bash
set -euo pipefail

repo=$(cd "$(dirname "$0")/../.." && pwd)
if command -v podman >/dev/null 2>&1; then
  engine=podman
  user_args=(--userns=keep-id)
elif command -v docker >/dev/null 2>&1; then
  engine=docker
  user_args=(--user "$(id -u):$(id -g)")
else
  echo 'Install Podman or Docker first' >&2
  exit 1
fi

"$engine" build -t ymliberty-linux-builder -f "$repo/scripts/linux/Dockerfile" "$repo"
"$engine" run --rm "${user_args[@]}" \
  -v "$repo:/workspace:Z" ymliberty-linux-builder
