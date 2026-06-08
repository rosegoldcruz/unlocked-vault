#!/usr/bin/env bash
set -euo pipefail
 
echo "================================================"
echo "Vaulted Push - All 3 Iron Vault Repos"
echo "================================================"
 
BASE="/home/vupi-projects"
REPOS=("ironvaulttoken.com" "info.ironvaulttoken.com" "member.ironvaulttoken.com")
 
for REPO in "${REPOS[@]}"; do
    echo ""
    echo "------------------------------------------------"
    echo "Pushing: $REPO"
    echo "------------------------------------------------"
    cd "$BASE/$REPO"
    git add .
    git commit -m "vault push" || echo "Nothing to commit in $REPO, skipping."
    git push
done
 
echo ""
echo "================================================"
echo "DONE - All repos pushed."
echo "================================================"
 