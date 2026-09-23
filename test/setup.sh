#!/usr/bin/env bash

TARGET_DIR="my_repo"
echo "[*] Setting up challenge environment..."

if [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
    echo "[-] Removing existant '${TARGET_DIR}' directory..."
fi

if [ -f "challenge.zip" ]; then
    unzip -q challenge.zip
    echo "[+] Challenge environment created in '${TARGET_DIR}'"
else
    echo "[x] setup.sh: challenge.zip not found!"
    exit 1
fi
