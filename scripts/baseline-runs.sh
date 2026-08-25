#!/usr/bin/env bash
# Local baseline: run the full suite N times at the local retry setting (0) and record the result
# of each run. Three passes rather than one because a single green run on a live third-party site
# says nothing about the true pass rate.
set -uo pipefail
RUNS=${RUNS:-3}
OUT=${OUT:-/tmp/pw-baseline}
mkdir -p "$OUT"

for i in $(seq 1 "$RUNS"); do
  echo "=== run $i of $RUNS ==="
  npx playwright test --reporter=list >"$OUT/run-$i.log" 2>&1
  echo "exit=$?"
  grep -E '^\s+[0-9]+ (passed|failed|flaky|skipped)|^Running [0-9]+ tests' "$OUT/run-$i.log" | tail -6
  grep -E '^\s+[0-9]+\) ' "$OUT/run-$i.log" | sed 's/^/    FAILED: /' | head -20
  echo
done
echo "logs in $OUT"
