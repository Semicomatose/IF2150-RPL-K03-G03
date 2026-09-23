#!/usr/bin/env bash

TARGET_DIR="my_repo"
echo "[*] Resetting challenge environment..."

if [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
    echo "[-] Removing existant '${TARGET_DIR}' directory..."
fi

if [ -f "challenge.zip" ]; then
    unzip -q challenge.zip
    echo "[+] Challenge environment recreated in '${TARGET_DIR}'"
else
    echo "[x] setup.sh: challenge.zip not found!"
    exit 1
fi
