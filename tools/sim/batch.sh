#!/bin/bash
cd /home/claude/mazmorra-coop/tools/sim
jobs_list=""
for lv in experto medio; do for ci in 0 1 2 3 4 5 6 7; do jobs_list="$jobs_list $ci:$lv"; done; done
echo $jobs_list | tr ' ' '\n' | xargs -P 2 -I{} bash -c 'ci=${1%%:*}; lv=${1##*:}; node run.js $ci $lv 15 > /tmp/claude-0/-home-claude/f42bd7ed-458c-5e0c-819e-7914bc60a932/scratchpad/res/$ci-$lv.json 2> /tmp/claude-0/-home-claude/f42bd7ed-458c-5e0c-819e-7914bc60a932/scratchpad/res/$ci-$lv.err; echo done $1' _ {}
