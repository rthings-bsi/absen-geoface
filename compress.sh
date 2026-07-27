#!/bin/bash
cd "/c/Project Web/Joki/unijs"
rm -f ../unijs-project.zip
zip -r ../unijs-project.zip . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".git/*" \
  -x ".vercel/*" \
  -x "AGENTS.md" \
  -x "CLAUDE.md" \
  -x ".claude/*" \
  -x "PRD.md" \
  -x "tsconfig.tsbuildinfo" \
  -x "stich/*" \
  -x "stitch_absensi.html" \
  -x "stitch_absensi.json" \
  -x "data/*.db" \
  -x "data/*.db-wal" \
  -x "data/*.db-shm" \
  -x "compress.sh"
