#!/bin/bash
cd /home/claude/mazmorra-coop/tools/sim
for c in 0 1 2 3 4 5 6 7; do for p in none noPri noSec noAbil; do echo "$c $p"; done; done | xargs -P 2 -L 1 bash -c 'node whatif.js $0 $1 8 > /tmp/claude-0/-home-claude/f42bd7ed-458c-5e0c-819e-7914bc60a932/scratchpad/abl/$0-$1.json'
echo ABL_DONE
