#!/usr/bin/env bash

if ! git fsck --full > /dev/null 2>&1; then
    echo "[x] verify.sh: git repository structure is still corrupted"
    exit 0
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "[x] verify.sh: working directory has uncommited or dirty changes"
    exit 25
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "[x] verify.sh: HEAD is not on main/master branch"
    exit 50
fi

echo "[v] Challenge solved, congratulations!"
exit 100
