#!/usr/bin/env bash

TARGET_DIR="my_repo"

if [ ! -d "$TARGET_DIR" ]; then
    echo "[x] verify.sh: challenge directory missing"
    exit 1
fi

cd "$TARGET_DIR" || exit 1

if ! git fsck --full > /dev/null 2>&1; then
    echo "[x] verify.sh: git repository structure is still corrupted"
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "[x] verify.sh: working directory has uncommited or dirty changes"
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "[x] verify.sh: HEAD is not on main/master branch"
    exit 1
fi

echo "[w] Challenge solved, congratulations!"
exit 0
